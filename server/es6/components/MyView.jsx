import React from 'react';
import ReactDOM from 'react-dom';
import {Row, Col, Button, Panel, FormControl} from 'react-bootstrap';
import JSZip from 'jszip';
import { toJS } from 'mobx';
import JsonHelper from '../JsonHelper';
import filesaver from '../FileSaver';
import BackChainActions from '../BackChainActions';

export default class MyView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      btIdsListUI:[],
      activeBtIdIndex: 0,
      indexOfBusinessTranction: 0
    };
  }

  componentDidMount() {
    this.listBusinessTransactionIds();
    document.getElementById("defaultOpen").click();
  }

  toggleActiveBtId(position, businessTransactionId, indexOfBusinessTranction) {
    if (this.state.activeBtIdIndex === position) {
      return;
    }
    this.setState({activeBtIdIndex : position, indexOfBusinessTranction: indexOfBusinessTranction});
  }

  setActiveBtIdColor(position) {
    return this.state.activeBtIdIndex === position ? "lightgray" : "";
  }

  onHoverBtId(event) {
    event.currentTarget.style.backgroundColor = 'lightgray';
  }

  onHoverOutBtId(position, event) {
    if (this.state.activeBtIdIndex === position) {
      return;
    }
    event.currentTarget.style.backgroundColor = 'white';
  }

  listBusinessTransactionIds(businessTransactionId) {
    this.state.btIdsListUI.splice(0, this.state.btIdsListUI.length);
    let businessTransactionIdRegEx = new RegExp("^" + businessTransactionId + ".*$");
    let businessTransactions = this.props.store.viewTransactions.enterprise.transactionSlice.businessTransactions;
    
    if(businessTransactionId) {
      let indexOfBusinessTranction = 0;
      for (let i = 0; i < businessTransactions.length; i++) {
        if((businessTransactions[i].btid.toString()).match(businessTransactionIdRegEx)) {
          indexOfBusinessTranction = i;
          this.state.btIdsListUI.push(<tr key={businessTransactions[i].btid} onClick={this.toggleActiveBtId.bind(this, i, businessTransactions[i].btid, i)} onMouseOver={this.onHoverBtId.bind(this)} onMouseOut = {this.onHoverOutBtId.bind(this, i)} style={{cursor:'pointer', borderBottom:'1px solid gray', backgroundColor: this.setActiveBtIdColor(i)}}>
                                        <td style={{lineHeight:'0.8'}}>
                                          {businessTransactions[i].btid}
                                        </td>
                                      </tr>);
        }
      }
      if(this.state.btIdsListUI.length == 1) {
        this.setState({indexOfBusinessTranction: indexOfBusinessTranction});
      }
    } else {
      for (let i = 0; i < businessTransactions.length; i++) {
        this.state.btIdsListUI.push(<tr key={businessTransactions[i].btid} onClick={this.toggleActiveBtId.bind(this, i, businessTransactions[i].btid, i)} onMouseOver={this.onHoverBtId.bind(this)} onMouseOut = {this.onHoverOutBtId.bind(this, i)} style={{cursor:'pointer', borderBottom:'1px solid gray', backgroundColor: this.setActiveBtIdColor(i)}}>
                                      <td style={{lineHeight:'0.8'}}>
                                        {businessTransactions[i].btid}
                                      </td>
                                    </tr>);
      }
    }
  }

  onBtIdChange(event) {
    this.setState({activeBtIdIndex : 0});
    this.listBusinessTransactionIds(event.target.value.trim());
  }

  openTab(tabName, evt) {
    let i, tabcontent, tablinks;
    
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    // Show the current tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.style.backgroundColor = 'rgba(0, 133, 200, 1)';
    evt.currentTarget.style.color = 'white';

    if(tabName === 'TnxMsg') {
      let element = evt.currentTarget.parentElement.getElementsByClassName('docsTab')[0];
      element.style.backgroundColor = 'rgba(228, 228, 228, 1)';
      element.style.color = '#646464';
    } else if (tabName === 'Docs') {
      let element = evt.currentTarget.parentElement.getElementsByClassName('tnxMsgTab')[0];
      element.style.backgroundColor = 'rgba(228, 228, 228, 1)';
      element.style.color = '#646464';
      //TODO JsonHelper.listDocuments
    }
  }

  render() {
    const contentHeight = window.innerHeight - 300;
    const styles = {
      panelHeading: {
        borderTopRightRadius: '10px',
        borderTopLeftRadius: '10px',
        backgroundColor: 'white'
      },
      panelTitle: {
        fontWeight: 'bold',
        display: 'inline-block',
        color: '#646464'
      },
      panel: {
        backgroundColor: 'rgba(250, 250, 250, 1)',
        marginBottom: '0px',
        borderRadius: '10px'
      },
      panelBody: {
        padding: 20,
        borderBottomRightRadius: '10px',
        borderBottomLeftRadius: '10px'
      },
      jsonPanel: {
        marginBottom: '20px',
        backgroundColor: 'white',
        paddingLeft: '1.5em',
        width: '74%',
        borderTopWidth: '2px',
        borderTopColor: 'rgb(0, 133, 200)',
        borderTopLeftRadius: '0px',
        height: (contentHeight + 13)
      },
      btidTblDiv: {
        border: '1px solid #ccc',
        backgroundColor: 'white',
        height: contentHeight,
        paddingLeft: '0px',
        marginRight: '35px',
        marginTop: '5px',
        width: '190px',
        overflowX: 'hidden',
        overflowY:'scroll'
      },
      selectBtIdLabel: {
        fontSize: '12.2px', 
        color: '#646464', 
        marginLeft: '-5px'
      },
      btIdSearchInput: {
        width: '215px', 
        paddingLeft: '10px'
      },
      tablinks: {
        borderTopLeftRadius: '8px',
        borderTopRightRadius:'8px',
        height : '27px',
        lineHeight : '27px',
        textAlign : 'center',
        cursor: 'pointer'
      }
    };

    JsonHelper.showCommon(this.props.store.viewTransactions.enterprise.transactionSlice.businessTransactions[this.state.indexOfBusinessTranction]);
    const tabContents = (<Row style={{marginLeft: '0px'}}>
                              <Col xs={1} className="tablinks tnxMsgTab" onClick={(e) => this.openTab('TnxMsg', e)} id="defaultOpen" style={Object.assign({}, styles.tablinks, {color:'white', backgroundColor:'rgba(0, 133, 200, 1)', width:'19%'})}>
                                <span style={{verticalAlign : 'sub'}}>Transaction Message</span>
                              </Col>
                              <Col xs={2} className="tablinks docsTab" onClick={(e) => this.openTab('Docs', e)} style={Object.assign({}, styles.tablinks, {marginLeft:'2px', width:'auto',color:'#646464', backgroundColor : 'rgba(228, 228, 228, 1)'})}>
                                <span style={{verticalAlign : 'sub'}}>Documents</span>
                              </Col>
                              <div id='TnxMsg' className="tabcontent">
                                <pre id="json-renderer" style={styles.jsonPanel}></pre>
                              </div>
                              <div id='Docs' className="tabcontent">
                                <pre style={styles.jsonPanel}></pre>
                              </div>
                          </Row>);

    return (<div className={"panel panel-default"} style={styles.panel}>
              <div className={"panel-heading"} style={styles.panelHeading}>
                <div className="panel-title" style={styles.panelTitle}>Event Details: My View</div>
                <i onClick={() => BackChainActions.setMyAndDiffViewActive(false)} className="fa fa-times" aria-hidden="true" style={{float: 'right', cursor: 'pointer', color: '#646464', fontSize: '21px'}}/>
              </div>
              <div className={"panel-body"} style={styles.panelBody}>
                <p style={{fontSize: '12px', color: '#646464'}}>
                  <strong>Transaction ID:</strong> <span>{this.props.store.viewTransactions.enterprise.id}</span>
                </p>
                <br/>
                <span style={styles.selectBtIdLabel}>
                  <i style={{fontSize: '14px', color: '#999999'}} className="fa fa-search" aria-hidden="true" />
                  &nbsp;Select Business Transaction ID:
                </span>

                <div className={"row"} style={{marginBottom: '6px', marginTop: '3px'}}>
                  <div className={"col-md-2"} style={styles.btIdSearchInput}>
                    <FormControl type="text" onChange={this.onBtIdChange.bind(this)} placeholder="Search for BTID" />
                    <div className={"table-responsive"} style={styles.btidTblDiv}>
                      <table className={"table"}>
                        <tbody>
                          {this.state.btIdsListUI}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {tabContents}
                </div>
              </div>
          </div>);
  }
}
