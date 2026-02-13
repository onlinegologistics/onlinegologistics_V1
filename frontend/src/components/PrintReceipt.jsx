import React from 'react';

const PrintReceipt = React.forwardRef(({ data }, ref) => {
    if (!data) return null;

    const styles = {
        page: {
            width: '100%',
            padding: '3mm',
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: '#000',
            boxSizing: 'border-box',
        },
        receiptContainer: {
            border: '3px solid #000',
            padding: '6px',
            marginBottom: '8px',
            pageBreakInside: 'avoid',
        },
        header: {
            border: '2px solid #000',
            display: 'grid',
            gridTemplateColumns: '80px 1fr 180px',
            marginBottom: '3px',
        },
        logoSection: {
            borderRight: '2px solid #000',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        companySection: {
            borderRight: '2px solid #000',
            padding: '5px 8px',
            textAlign: 'center',
        },
        bookingSection: {
            padding: '4px 6px',
            fontSize: '9px',
            lineHeight: '1.3',
        },
        companyName: {
            fontSize: '20px',
            fontWeight: 'bold',
            margin: '2px 0',
            letterSpacing: '0.5px',
        },
        gstLine: {
            fontSize: '8px',
            margin: '1px 0',
        },
        riskLine: {
            fontSize: '10px',
            fontWeight: 'bold',
            margin: '2px 0',
        },
        infoRow: {
            border: '2px solid #000',
            borderTop: 'none',
            padding: '3px 6px',
            fontSize: '9px',
            fontWeight: 'bold',
        },
        mainGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3px',
            marginBottom: '3px',
        },
        consignerBox: {
            border: '2px solid #000',
        },
        fieldRow: {
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '1px solid #000',
            padding: '2px 5px',
            fontSize: '9px',
        },
        fieldLabel: {
            fontWeight: 'bold',
        },
        itemsTable: {
            width: '100%',
            border: '2px solid #000',
            borderCollapse: 'collapse',
            marginBottom: '3px',
        },
        itemsTh: {
            border: '1px solid #000',
            padding: '3px',
            fontSize: '8px',
            fontWeight: 'bold',
            textAlign: 'center',
            backgroundColor: '#f0f0f0',
        },
        itemsTd: {
            border: '1px solid #000',
            padding: '3px 4px',
            fontSize: '9px',
        },
        bottomGrid: {
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr',
            gap: '3px',
            marginBottom: '3px',
        },
        conditionsBox: {
            border: '2px solid #000',
            padding: '4px 6px',
        },
        chargesBox: {
            border: '2px solid #000',
        },
        chargeRow: {
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '1px solid #000',
            padding: '3px 6px',
            fontSize: '9px',
        },
        totalRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 6px',
            fontSize: '11px',
            fontWeight: 'bold',
            backgroundColor: '#f0f0f0',
        },
        footer: {
            textAlign: 'center',
            fontSize: '7px',
            fontStyle: 'italic',
            padding: '2px',
        },
        copyLabel: {
            position: 'absolute',
            top: '3px',
            right: '3px',
            fontWeight: 'bold',
            fontSize: '9px',
            backgroundColor: '#fff',
            padding: '1px 4px',
            border: '1px solid #000',
        }
    };

    const SingleReceipt = ({ copyName }) => (
        <div style={{ position: 'relative', ...styles.receiptContainer }}>
            <div style={styles.copyLabel}>{copyName}</div>

            {/* Header */}
            <div style={styles.header}>
                {/* Logo */}
                <div style={styles.logoSection}>
                    <img 
                        src="/assets/logo.jpeg" 
                        alt="Online Go Logo" 
                        style={{ 
                            width: '65px', 
                            height: '65px', 
                            objectFit: 'contain'
                        }} 
                    />
                </div>

                {/* Company Info */}
                <div style={styles.companySection}>
                    <h1 style={styles.companyName}>ONLINE GO (SANGAMWADI)</h1>
                    <p style={{ fontSize: '8px', margin: '2px 0' }}>
                        PARKING NO 3, SANGAMWADI | Mob: 9209081234
                    </p>
                    <p style={styles.riskLine}>AT OWNER'S RISK UNINSURED</p>
                </div>

                {/* Booking Info */}
                <div style={styles.bookingSection}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                        Booking Office : Pune
                    </div>
                    <div>Sangamwadi(9209081234)</div>
                    {data.agent && (
                        <div style={{ marginTop: '3px', fontWeight: 'bold', fontSize: '9px' }}>
                            Agent: {data.agent}
                        </div>
                    )}
                    <div style={{ marginTop: '4px' }}>
                        <div style={{ fontSize: '8px' }}>From</div>
                        <div style={{ fontWeight: 'bold' }}>Pune</div>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                        <div style={{ fontSize: '8px' }}>To</div>
                        <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{data.station || ''}</div>
                    </div>
                    <div style={{ marginTop: '4px', fontWeight: 'bold' }}>
                        {(data.date ? new Date(data.date) : new Date()).toLocaleDateString('en-GB')}
                    </div>
                </div>
            </div>

            {/* Delivery Info */}
            <div style={styles.infoRow}>
                To {data.station || ''} Delivery details:- ({data.receiverMobile || '________________'})
            </div>

            {/* Consigner & Receipt Details Grid */}
            <div style={styles.mainGrid}>
                {/* Left: Consigner & Consignee Details */}
                <div style={styles.consignerBox}>
                    <div style={{ borderBottom: '2px solid #000', padding: '3px 5px', fontWeight: 'bold', fontSize: '9px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>Consigner's Name: {data.senderName || ''}</span>
                            <span>Tel No.: {data.senderMobile || ''}</span>
                        </div>
                        {data.senderAddress && (
                            <div style={{ fontSize: '8px', fontWeight: 'normal', marginTop: '2px' }}>
                                Address: {data.senderAddress}
                            </div>
                        )}
                    </div>
                    <div style={{ padding: '3px 5px', fontWeight: 'bold', fontSize: '9px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>Consignee's Name: {data.receiverName || ''}</span>
                            <span>Tel No.: {data.receiverMobile || ''}</span>
                        </div>
                        {data.receiverAddress && (
                            <div style={{ fontSize: '8px', fontWeight: 'normal', marginTop: '2px' }}>
                                Address: {data.receiverAddress}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Receipt Details - Only fields from form */}
                <div>
                    <div style={styles.fieldRow}>
                        <span style={styles.fieldLabel}>Receipt No:</span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {data.manualLrNo || `LR-${data._id?.slice(-8) || 'AUTO'}`}
                        </span>
                    </div>
                    {data.ewayBillNo && (
                        <div style={styles.fieldRow}>
                            <span style={styles.fieldLabel}>E-way Bill No:</span>
                            <span>{data.ewayBillNo}</span>
                        </div>
                    )}
                    {data.ewayBillDate && (
                        <div style={styles.fieldRow}>
                            <span style={styles.fieldLabel}>E-way Bill Date:</span>
                            <span>{new Date(data.ewayBillDate).toLocaleDateString('en-GB')}</span>
                        </div>
                    )}
                    {data.senderGst && (
                        <div style={styles.fieldRow}>
                            <span style={styles.fieldLabel}>Sender GST:</span>
                            <span>{data.senderGst}</span>
                        </div>
                    )}
                    {data.receiverGst && (
                        <div style={{ ...styles.fieldRow, borderBottom: 'none' }}>
                            <span style={styles.fieldLabel}>Receiver GST:</span>
                            <span>{data.receiverGst}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table - Only form fields */}
            <table style={styles.itemsTable}>
                <thead>
                    <tr>
                        <th style={{ ...styles.itemsTh, width: '35%' }}>Unit Type</th>
                        <th style={{ ...styles.itemsTh, width: '15%' }}>No. of Parcels</th>
                        <th style={{ ...styles.itemsTh, width: '35%' }}>Remarks</th>
                        <th style={{ ...styles.itemsTh, width: '15%' }}>Payment</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={styles.itemsTd}>{data.unit || 'Parcel'}</td>
                        <td style={{ ...styles.itemsTd, textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                            {data.noOfParcels || ''}
                        </td>
                        <td style={styles.itemsTd}>{data.remarks || ''}</td>
                        <td style={{ ...styles.itemsTd, textAlign: 'center', fontWeight: 'bold' }}>
                            {data.paymentMode || ''}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Payment Mode & Credit Info if applicable */}
            {data.paymentMode === 'Credit' && (data.creditParty || data.creditOffice) && (
                <div style={{ border: '2px solid #000', padding: '3px 6px', marginBottom: '3px', fontSize: '9px', fontWeight: 'bold' }}>
                    Credit Details: 
                    {data.creditParty && ` Party: ${data.creditParty}`}
                    {data.creditOffice && ` Office: ${data.creditOffice}`}
                </div>
            )}

            {/* Bottom Grid - Conditions & Charges */}
            <div style={styles.bottomGrid}>
                {/* Conditions */}
                <div style={styles.conditionsBox}>
                    <div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: '2px' }}>
                        CONSIGNMENT RECEIVED IN GOODS CONDITION
                    </div>
                    <div style={{ fontSize: '8px', marginBottom: '3px' }}>
                        <strong>Time:</strong> __________ <strong style={{ marginLeft: '15px' }}>Date:</strong> __________
                    </div>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '2px' }}>
                        CONSIGNEE'S NAME, SIGNATURE & STAMP
                    </div>
                    <div style={{ fontSize: '7px', marginBottom: '3px' }}>
                        <strong>Remark/ Door Delivery Address</strong>
                    </div>
                    <div style={{ fontSize: '7px', lineHeight: '1.2', marginBottom: '3px', textAlign: 'justify' }}>
                        काय शामान, गादीवर बांधुन व गुदामलात मालाची पुर्ण तपासणी करुबन घ्यावी, मालच तोडीफोडी खराबीसी जवाबदार राहणार नाही. 
                        We do not carry Cash & Jewellary We undertake the consignment of the extent of amount of freight of consignment only, 
                        no responsibility for loss/damage of Consignment. Return to be Claim as per Indian Carrier Act.
                    </div>
                    <div style={{ fontSize: '7px', fontWeight: 'bold' }}>
                        Unloading charges to be paid at destination.
                    </div>
                    <div style={{ fontSize: '7px', fontWeight: 'bold', marginTop: '2px' }}>
                        GST IS PAYABLE BY CONSIGNEE AT THE TIME OF CLAIM.
                    </div>
                    <div style={{ fontSize: '7px', fontWeight: 'bold', marginTop: '4px' }}>
                        Terms & Conditions On QR Code read and accepted
                    </div>
                </div>

                {/* Charges - Only actual form fields */}
                <div style={styles.chargesBox}>
                    <div style={styles.chargeRow}>
                        <span>Freight</span>
                        <span>{parseFloat(data.freight || 0).toFixed(2)}</span>
                    </div>
                    {parseFloat(data.insurance || 0) > 0 && (
                        <div style={styles.chargeRow}>
                            <span>Insurance</span>
                            <span>{parseFloat(data.insurance).toFixed(2)}</span>
                        </div>
                    )}
                    {parseFloat(data.cartage || 0) > 0 && (
                        <div style={styles.chargeRow}>
                            <span>Cartage</span>
                            <span>{parseFloat(data.cartage).toFixed(2)}</span>
                        </div>
                    )}
                    {parseFloat(data.loading || 0) > 0 && (
                        <div style={styles.chargeRow}>
                            <span>Loading</span>
                            <span>{parseFloat(data.loading).toFixed(2)}</span>
                        </div>
                    )}
                    {parseFloat(data.unloading || 0) > 0 && (
                        <div style={styles.chargeRow}>
                            <span>Unloading</span>
                            <span>{parseFloat(data.unloading).toFixed(2)}</span>
                        </div>
                    )}
                    {((parseFloat(data.cgst || 0) + parseFloat(data.sgst || 0) + parseFloat(data.igst || 0)) > 0) && (
                        <div style={styles.chargeRow}>
                            <span>GST ({parseFloat(data.cgstPercent || 0) + parseFloat(data.sgstPercent || 0) + parseFloat(data.igstPercent || 0)}%)</span>
                            <span>{(parseFloat(data.cgst || 0) + parseFloat(data.sgst || 0) + parseFloat(data.igst || 0)).toFixed(2)}</span>
                        </div>
                    )}
                    <div style={styles.totalRow}>
                        <span>Total Amount</span>
                        <span>₹ {parseFloat(data.grandTotal || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            
        </div>
    );

    return (
        <div ref={ref} style={styles.page}>
            <SingleReceipt copyName="TransporterPrint" />
            
            <div style={{ 
                borderTop: '2px dashed #000', 
                margin: '5px 0', 
                textAlign: 'center',
                fontSize: '9px',
                padding: '3px 0',
                position: 'relative'
            }}>
                <span style={{ backgroundColor: '#fff', padding: '0 10px' }}>✂ Cut Here ✂</span>
            </div>
            
            <SingleReceipt copyName="Customer Copy" />
        </div>
    );
});

export default PrintReceipt;
