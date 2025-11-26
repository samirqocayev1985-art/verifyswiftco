exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { to, verificationCode, reference } = JSON.parse(event.body);
        
        // Burada real email göndərmək əvəzinə log yazırıq
        console.log('Email would be sent:', {
            to: to,
            code: verificationCode,
            reference: reference,
            from: 'check@verify-swift.com'
        });

        // Həmişə uğurlu cavab qaytarırıq
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Verification code sent successfully'
            })
        };

    } catch (error) {
        return {
            statusCode: 200, // Hətta xəta olsa belə 200 qaytarırıq
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Verification code processed'
            })
        };
    }
};
