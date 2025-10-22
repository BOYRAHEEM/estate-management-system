const fetch = require('node-fetch').default;

async function testPdfGeneration() {
    try {
        console.log('Testing PDF generation...');
        
        // First, let's try to login
        const loginResponse = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        console.log('Login successful:', loginData);
        
        // Get cookies from login response
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('Cookies:', cookies);
        
        // Now test PDF generation
        const pdfResponse = await fetch('http://localhost:3000/api/reports/rooms-pdf', {
            method: 'GET',
            headers: {
                'Cookie': cookies || ''
            }
        });
        
        console.log('PDF Response status:', pdfResponse.status);
        console.log('PDF Response headers:', Object.fromEntries(pdfResponse.headers.entries()));
        
        if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.buffer();
            console.log('PDF generated successfully! Size:', pdfBuffer.length, 'bytes');
        } else {
            const errorText = await pdfResponse.text();
            console.error('PDF generation failed:', errorText);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testPdfGeneration();
