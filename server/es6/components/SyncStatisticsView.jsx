import React from 'react';
import { observer } from 'mobx-react';
import { Row, Col, Button, Panel} from 'react-bootstrap';
import BackChainActions from '../BackChainActions';
import HeaderView from "./HeaderView";
import {BigNumber} from 'bignumber.js';
import moment from 'moment';
import {Link} from 'react-router-dom';

@observer export default class SyncStatisticsView extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        let me = this;
        BackChainActions.getSyncStatistics(function(error, result) {
            if(!error) {
                me.prepareStatisticsReportData(result);
            }
        });
    }

    prepareStatisticsReportData(syncStatistics) {
        let earliestSyncSequenceNo = syncStatistics.earliestSyncSequenceNo;
        let latestSyncSequenceNo = syncStatistics.latestSyncSequenceNo;
        let me = this;
        let allTransactionsArr = [];
        if(syncStatistics.gaps.length >0) {
            for(let i = 0; i < syncStatistics.gaps.length; i++) {
                let gap = syncStatistics.gaps[i];
                let gapFromSequenceNo = gap.fromSequenceNo;
                let gapToSequenceNo = gap.toSequenceNo;
                let sequenceNoDiff = (new BigNumber(gapFromSequenceNo).minus(new BigNumber(earliestSyncSequenceNo)));
                if(sequenceNoDiff.greaterThan(new BigNumber(0))) {
                    let uptoSequenceNo = ((new BigNumber(gapFromSequenceNo)).minus(new BigNumber(1)));
                    allTransactionsArr.push({type : "fullSync", fromSeqNo : earliestSyncSequenceNo, toSeqNo : uptoSequenceNo.valueOf()});
                } 
                
                let noOfGapRecords = (new BigNumber(gapToSequenceNo).minus(new BigNumber(gapFromSequenceNo))).valueOf();
                let fromGapDate = gap.fromDateInMillis;
                let toGapDate = gap.toDateInMillis;
                let hrs = me.returnDiffInHrsMins(fromGapDate, toGapDate).hours + 'hrs';
                let mins = me.returnDiffInHrsMins(fromGapDate, toGapDate).mins + 'mins';
                allTransactionsArr.push({type : "gap", fromSeqNo : gap.fromSequenceNo, toSeqNo : gap.toSequenceNo, noOfGaps : noOfGapRecords, syncMsg : 'Sequence Gap',time:hrs + ' ' + mins, fromDate : fromGapDate, toDate : toGapDate});

                earliestSyncSequenceNo = ((new BigNumber(gapToSequenceNo)).plus(new BigNumber(1))).valueOf();
                
                if((i+1 == syncStatistics.gaps.length) && (new BigNumber(latestSyncSequenceNo).greaterThan(new BigNumber(gapToSequenceNo)))) {
                    allTransactionsArr.push({type : "fullSync", fromSeqNo : earliestSyncSequenceNo, toSeqNo : new BigNumber(latestSyncSequenceNo).valueOf()});
                    this.syncStatisticsReport(allTransactionsArr);
                }
            }
        } else {
            let fullSyncTrxnsNos = [];
            allTransactionsArr.push({type : "fullSync", fromSeqNo : earliestSyncSequenceNo, toSeqNo : new BigNumber(latestSyncSequenceNo).valueOf()});
            fullSyncTrxnsNos.push(syncStatistics.earliestSyncSequenceNo);
            fullSyncTrxnsNos.push(syncStatistics.latestSyncSequenceNo);
            this.getTransactionsBySequenceNos(fullSyncTrxnsNos,allTransactionsArr);
        }
    }

    syncStatisticsReport(allTransactionsArr) {
        let fullSyncTrxnsNos = [];
        let me = this;
        for(let i = 0; i < allTransactionsArr.length; i++) {
            let txn = allTransactionsArr[i];
            if(txn.type == 'fullSync') {
                fullSyncTrxnsNos.push(txn.fromSeqNo);
                fullSyncTrxnsNos.push(txn.toSeqNo);
            }
        }
        this.getTransactionsBySequenceNos(fullSyncTrxnsNos,allTransactionsArr);
    }

    getTransactionsBySequenceNos(fullSyncTrxnsNos,allTransactionsArr) {
        let me = this;
        BackChainActions.getTransactionsBySequenceNos(
            fullSyncTrxnsNos,
            function(error, result) {
                if(!error) {
                    me.props.store.syncStatisticsReport.splice(0, me.props.store.syncStatisticsReport.length);
                    for(let i = 0; i < allTransactionsArr.length; i++) {
                        let txn = allTransactionsArr[i];
                        let isFromSeqMatch = false, isToSeqMatch = false;
                        if(txn.type == 'gap') {
                            txn.fromDate = moment(new Date(txn.fromDate)).format('MMM DD,YYYY HH:mm A');
                            txn.toDate = moment(new Date(txn.toDate)).format('MMM DD,YYYY HH:mm A');
                            me.props.store.syncStatisticsReport.push(txn);
                        } else {
                            let syncStatistics = {type : 'fullsync', syncMsg : 'Full Sync', fromDate : '', toDate : '', fromSeqNo : '', toSeqNo:'', noOfGaps:''};
                            for(let i = 0; i < result.length; i++) {
                                let transaction = result[i];
                                if(transaction.txnSequenceNo == txn.fromSeqNo) {
                                    syncStatistics.fromDate = moment(transaction.date, "YYYY-MM-DDTHH:mm:ssZ").format('MMM DD,YYYY HH:mm A');
                                    syncStatistics.fromSeqNo = transaction.txnSequenceNo;
                                    isFromSeqMatch = true;
                                } else if(transaction.txnSequenceNo == txn.toSeqNo) {
                                    syncStatistics.toDate = moment(transaction.date, "YYYY-MM-DDTHH:mm:ssZ").format('MMM DD,YYYY HH:mm A');
                                    syncStatistics.toSeqNo = transaction.txnSequenceNo;
                                    isToSeqMatch = true;
                                }
                                if(isFromSeqMatch && isToSeqMatch) {
                                    me.props.store.syncStatisticsReport.push(syncStatistics);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        );
    }

    selectedGaps(event){
        let currentGapDOM = event.currentTarget;
        let fromClickedGap  = event.currentTarget.getAttribute('fromsequenceno');
        let toClickedGap  = event.currentTarget.getAttribute('tosequenceno');
        let clickedGap = fromClickedGap+'-'+toClickedGap;
        let selectedGapsForSync = this.store.selectedGapsForSync;
        if(selectedGapsForSync.indexOf(clickedGap) > -1) {
            selectedGapsForSync.splice(selectedGapsForSync.indexOf(clickedGap), 1);
            currentGapDOM.style.backgroundColor = "#fccfcf";
            if(currentGapDOM.nextElementSibling){
                currentGapDOM.nextElementSibling.style.backgroundColor= "#fccfcf";
            } else {
                currentGapDOM.previousSibling.style.backgroundColor= "#fccfcf";
            } 
           
        } else {
            selectedGapsForSync.push(clickedGap);
            currentGapDOM.style.backgroundColor = "#f88b8b";
            if(currentGapDOM.nextElementSibling){
                currentGapDOM.nextElementSibling.style.backgroundColor= "#f88b8b";
            } else {
                currentGapDOM.previousSibling.style.backgroundColor= "#f88b8b";
            }
        }
        if(selectedGapsForSync.length >0) {
            document.getElementById("syncSelectedGap").disabled = false;
        }
        else {
            document.getElementById("syncSelectedGap").disabled = true;
        }
        console.log(this.store.selectedGapsForSync);
    }

    returnDiffInHrsMins(toMillis, fromMillis) {
        let minDiff = (toMillis - fromMillis)/60000;
        if (minDiff < 0) {
            minDiff *= -1;
        }
        const hours = Math.floor(minDiff/60);
        const mins =  Math.floor(minDiff%60);
        return {hours: hours, mins: mins};
    }

    render() {
        let fieldProps = {
			panelBodyTitle : {
				paddingLeft: '20px',	
				fontSize: '22px',
				color: '#515151'
			},
			panelBody : {
				padding: '70px 0px 20px 80px',
				backgroundColor: 'white'
			},
			panelDefault : {
				borderStyle : 'none'
            }
        };
        
        let syncStatisticsReportUI = [];
        let gapSize = 0;
        for(let i=0; i < this.props.store.syncStatisticsReport.length; i++) {
            let syncStatisticsReport = this.props.store.syncStatisticsReport[i];
            if(syncStatisticsReport.type == "fullsync") {
                syncStatisticsReportUI.push(<FullSync key={i + 'full'} syncStatisticsReport = {syncStatisticsReport}/>);
            }
            if(this.props.store.syncStatisticsReport.length!=1 && i==0) {
                syncStatisticsReportUI.push(<VerticalLine key={'vertical'} verticlHeight = {this.props.store.syncStatisticsReport.length-2}/>);
            }
            if(syncStatisticsReport.type == "gap") {
                gapSize++;
                syncStatisticsReportUI.push(<Gap key={i + 'gap'} syncStatisticsReport = {syncStatisticsReport} selectedGaps = {this.selectedGaps} store = {this.props.store} />);
            }
        }

        let latestNEarliestSync = (
            <div>
                {syncStatisticsReportUI}
            </div>
        );

        let panelBody = "";
        let isFullSynced=false;
        if(this.props.store.syncStatisticsReport.length==1) {
            isFullSynced = true;
            panelBody = (<div style={{height: '100%', width: '92%'}}>
                            <Row style={fieldProps.panelBodyTitle}>
                                <Col md={1} style={{width: '7%'}}>
                                <span>
                                    <i className="fa fa-database" aria-hidden="true">
                                        &nbsp;<i className="fa fa-refresh" aria-hidden="true" style = {{fontSize: '13px'}}/>
                                    </i>
                                </span>
                                </Col>
                                <Col> Database Sync Statistics </Col>
                            </Row><hr/><br/>
                            <Row>
                                <Col md={1} style={{width: '6%', color: '#229978'}}>  <i style ={{fontSize: '2.5em'}} className="fa fa-check-circle" aria-hidden="true"></i></Col>
                                <Col>
                                    <span style={{color: '#229978', fontSize: '1.3em', fontWeight: 700}}>Your DB is fully synced.</span> <br/>
                                </Col>
                            </Row>
                        </div>);
        } else {
            panelBody = (<div style={{height: '100%', width: '92%'}}>
                                <Row style={fieldProps.panelBodyTitle}>
                                    <Col md={1} style={{width: '7%'}}>
                                    <span>
                                        <i className="fa fa-database" aria-hidden="true">
                                            &nbsp;<i className="fa fa-refresh" aria-hidden="true" style = {{fontSize: '13px'}}/>
                                        </i>
                                    </span>
                                    </Col>
                                    <Col> Database Sync Statistics </Col>
                                </Row><hr/><br/>
                                <Row>
                                    <Col md={1} style={{width: '6%', color: '#ef941b'}}> <i style ={{fontSize: '2.5em'}} className="fa fa-exclamation-circle" aria-hidden="true"></i></Col>
                                    <Col>
                                        <span style={{color: '#ef941b', fontSize: '1.3em', fontWeight: 700}}> There are {gapSize} sequence gaps. </span> <br/>
                                        Click one or more to sync and close the sequence  gaps.
                                    </Col>
                                </Row>
                        </div>);
        }

        return(
            <div className={"panel panel-default"} style={fieldProps.panelDefault}>
				<HeaderView store={this.props.store} size="big"/>
                <div className={"panel-body"} style={fieldProps.panelBody}>
                    {panelBody}<br/>
                    {latestNEarliestSync}<br/>
                    <SyncGapButtons selectedGapsLbl = {"Sync Selected Gaps"} allGapsLbl = {"Sync All Gaps"} isFullSynced={isFullSynced}/>
                </div>
		  	</div>
        )
    }
}

const FullSync = (props) => {
    let fieldProps = {
        syncSuccessInfo : {
            marginLeft: '3.7em',
            width: '364px',
            height: '53px',
            fontSize: '12px',
            backgroundColor: 'rgba(215, 235, 242, 1)',
            borderRadius: '0px 20px 20px 0px',
        },
        syncDate : {
            borderWidth: '0px',
            height: '40px',
            lineHeight: '40px',
            border: 'none',
            borderRadius: '20px',
            borderTopLeftRadius: '0px',
            borderBottomLeftRadius: '0px',
            boxShadow: 'none',
            textAlign: 'left',
            backgroundColor: 'rgba(215, 235, 242, 1)'
        }
    }
	return (
        <div>
            <Row style={{marginLeft: '0px'}}>
                <Col md={6} style={fieldProps.syncSuccessInfo}>
                    <i style = {{fontSize : '18px', color: 'rgba(0, 133, 200, 1)', display: 'block', float: 'left', marginTop: '10px'}} className="fa fa-circle" aria-hidden="true" />
                    <span style={{paddingLeft:'35px',paddingTop:'10px',fontWeight:'700',display: 'block'}}>{props.syncStatisticsReport.syncMsg}</span> 
                    <span style={{paddingLeft:'19px'}}>{props.syncStatisticsReport.fromDate}&nbsp;<span>-</span>{props.syncStatisticsReport.toDate}</span> 
                </Col>
            </Row>
            <br/>
        </div>
	)
}

const Gap = (props) => {
    let fieldProps = {
        gapInfo : {
            marginLeft: '65px',
            width: '337px',
            height: '53px',
            fontSize: '12px',
            backgroundColor: 'rgba(252, 207, 207, 1)',
            boxSizing: 'border-box',
            borderWidth: '0px 2px 0px 4px',
            borderTopStyle: 'initial',
            borderRightStyle: 'solid',
            borderBottomStyle: 'initial',
            borderLeftStyle: 'solid',
            borderTopColor: 'initial',
            borderRightColor: 'rgba(243, 91, 90, 1)',
            borderBottomColor: 'initial',
            borderLeftColor: 'rgba(243, 91, 90, 1)',
            borderRadius: '0px',
            zIndex: '1',
            cursor: 'pointer'
        },
        syncDate : {
            borderWidth: '0px',
            height: '53px',
            border: 'none',
            borderRadius: '20px',
            borderTopLeftRadius: '0px',
            borderBottomLeftRadius: '0px',
            boxShadow: 'none',
            textAlign: 'left',
            backgroundColor: 'rgb(252, 207, 207)',
            cursor: 'pointer'
        }
    }
    
    function selectedGaps(event) {
        props.selectedGaps(event);
    }
      
	return (
		<div>
            <Row style={{marginLeft: '0px'}}>
                <Col md={6} style={fieldProps.gapInfo}  onClick={selectedGaps.bind(this)} fromsequenceno = {props.syncStatisticsReport.fromSeqNo} tosequenceno = {props.syncStatisticsReport.toSeqNo}>
                    <span style={{display: 'block', fontWeight:'700', paddingLeft: '8px', paddingTop:'10px'}}>{props.syncStatisticsReport.syncMsg}</span>
                    <span style={{paddingLeft:'8px'}}>{props.syncStatisticsReport.fromDate}&nbsp;<span>-</span>{props.syncStatisticsReport.toDate}</span>
                </Col>
                <Col md={3} onClick={selectedGaps.bind(this)} fromsequenceno = {props.syncStatisticsReport.fromSeqNo} tosequenceno = {props.syncStatisticsReport.toSeqNo} style={Object.assign({}, fieldProps.syncDate, {width: '150px'})}>
                <span style={{paddingTop:'10px',display: 'block'}}><i className="fa fa-clock-o" aria-hidden="true"></i>&nbsp;&nbsp;{props.syncStatisticsReport.time}</span>
                <span><i className="fa fa-files-o" aria-hidden="true"></i>&nbsp;&nbsp;{props.syncStatisticsReport.noOfGaps}&nbsp;records</span>
                </Col>
            </Row>
            <br/>
        </div>
	)
}

const VerticalLine = (props) => {
    let fieldProps = {
        verticalLine : {
            borderLeft: '4px solid rgba(0, 133, 200, 1)',
            position: 'absolute',
            zIndex: '1',
            top: '423px'
        }
    }
    let verticlHeight = props.verticlHeight;
	return (
		<div style={Object.assign({}, fieldProps.verticalLine, {height: verticlHeight > 0 ? 72 * (verticlHeight + 1) : 72, left: verticlHeight == 0 ? 262 : 250 })}/>
	)
}

const SyncGapButtons = (props) => {
    let fieldProps = {
        button : {
            height: '35px',
            boxShadow: '1px 2px 2px rgba(0, 0, 0, 0.749019607843137)',
            fontStyle: 'normal',
            fontSize: '18px',
            backgroundColor: 'rgba(0, 133, 200, 1)',
            color: 'white',
            borderWidth: '0px'
        },
        cancelButton: {
            padding: '7px 23px',
            color: 'rgb(0, 120, 215)',
            borderColor: 'rgb(0, 120, 215)',
            fontSize: '16px',
            boxShadow: 'rgba(0, 0, 0, 0.75) 1px 2px 2px',
            height: '35px'
        }
    }

    function onHover(event) {
        event.currentTarget.style.backgroundColor = 'rgba(0, 114, 168, 1)';
    }

    function onHoverOut(event) {
        event.currentTarget.style.backgroundColor = 'rgba(0, 133, 200, 1)';
    }

    if(props.isFullSynced) {
        return (
            <div>
                <Row>
                    <Col md={1} style={{width: '6%'}}></Col>
                    <Col>
                        <Link to="/home"><Button  style = {fieldProps.button} onMouseOver = {onHover.bind(this)} onMouseOut = {onHoverOut.bind(this)}>Backchain Verify Home</Button></Link>
                    </Col>
                </Row>
            </div>
        )

    }else {
        return (
            <div>
                <Row>
                    <Col md={1} style={{width: '6%'}}></Col>
                    <Col>
                        <Link  to="/home"><Button style = {fieldProps.cancelButton} >Cancel</Button></Link>	&nbsp;&nbsp;
                        <Button disabled={true} id="syncSelectedGap" style={fieldProps.button} onMouseOver = {onHover.bind(this)} onMouseOut = {onHoverOut.bind(this)}>{props.selectedGapsLbl}</Button>&nbsp;
                        <Button style={Object.assign({}, fieldProps.button, {marginLeft : '10px'})} onMouseOver = {onHover.bind(this)} onMouseOut = {onHoverOut.bind(this)}>{props.allGapsLbl}</Button>
                    </Col>
                </Row>
            </div>
        )
    }
}