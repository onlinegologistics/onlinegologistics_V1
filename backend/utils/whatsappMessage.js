const buildBookingConfirmationMessage = (record = {}) => {
    const clientName = record.clientName ? `👤 *Customer:* ${record.clientName}\n` : '';
    const fromCity = record.fromCity ? `📍 *From:* ${record.fromCity}\n` : '';

    let destText = '';
    if (Array.isArray(record.destinations) && record.destinations.length > 0) {
        destText = record.destinations.map((d, index) => {
            const prefix = record.destinations.length > 1 ? `*Destination ${index + 1}:*\n` : '';
            const to = d.toCity ? `🏁 *To:* ${d.toCity}\n` : '';
            const parcels = d.noOfParcels ? `📦 *Parcels:* ${d.noOfParcels}\n` : '';
            const weight = d.weight ? `⚖️ *Weight:* ${d.weight}\n` : '';
            const amount = d.totalAmount ? `💰 *Amount:* ₹${d.totalAmount} (${d.paymentMode || 'Paid'})\n` : '';
            return `${prefix}${to}${parcels}${weight}${amount}`.trim();
        }).join('\n\n');
    } else if (record.toCity) {
        const to = `🏁 *To:* ${record.toCity}\n`;
        const parcels = record.noOfParcels ? `📦 *Parcels:* ${record.noOfParcels}\n` : '';
        const weight = record.weight ? `⚖️ *Weight:* ${record.weight}\n` : '';
        const amount = record.totalAmount ? `💰 *Amount:* ₹${record.totalAmount} (${record.paymentMode || 'Paid'})\n` : '';
        destText = `${to}${parcels}${weight}${amount}`.trim();
    }

    return `🚚 *ONLINE GO LOGISTICS*
*Booking Confirmation*
----------------------------------------
${clientName}${fromCity}${destText ? destText + '\n----------------------------------------\n' : ''}Fast, secure, and reliable deliveries across Maharashtra 🚚

Need parcel pickup, bulk booking, tracking, or support?
Call us:
📞 *92090 61234*

🌐 https://connectitapp.in/online-go-logistics
Thank you for choosing OnlineGo Logistics!`;
};

module.exports = { buildBookingConfirmationMessage };
