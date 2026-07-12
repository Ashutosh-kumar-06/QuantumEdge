const http = require('http');

const API_URL = 'http://localhost:4000';

async function runTests() {
    console.log("Starting Functional and Integrity Tests...");
    let passed = 0;
    let failed = 0;

    async function fetchAPI(path, method = 'GET', body = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 4000,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
            });
            req.on('error', reject);
            if (body) req.write(JSON.stringify(body));
            req.end();
        });
    }

    // 1. Healthcheck Test
    try {
        console.log("Running Test 1: Healthcheck");
        const res = await fetchAPI('/health');
        if (res.status === 200 && res.data.status === 'ok') {
            console.log("✅ Test 1 Passed");
            passed++;
        } else {
            throw new Error(`Unexpected response: ${JSON.stringify(res)}`);
        }
    } catch (e) {
        console.log("❌ Test 1 Failed: " + e.message);
        failed++;
    }

    // 2. Curriculum Integrity Test
    try {
        console.log("Running Test 2: Curriculum Integrity (Fetching Seeded Data)");
        const res = await fetchAPI('/api/curriculum');
        if (res.status === 200 && res.data.modules && res.data.modules.length > 0) {
            console.log(`✅ Test 2 Passed (Found ${res.data.modules.length} modules)`);
            passed++;
        } else {
            throw new Error(`Unexpected response or no modules: ${JSON.stringify(res)}`);
        }
    } catch (e) {
        console.log("❌ Test 2 Failed: " + e.message);
        failed++;
    }

    // 3. User Progress Integrity Test
    try {
        console.log("Running Test 3: User Progress Integrity");
        const res = await fetchAPI('/api/progress/student1');
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log(`✅ Test 3 Passed (Found progress data)`);
            passed++;
        } else {
            throw new Error(`Unexpected response: ${JSON.stringify(res)}`);
        }
    } catch (e) {
        console.log("❌ Test 3 Failed: " + e.message);
        failed++;
    }

    // 4. Python Simulation Job Queueing Test
    try {
        console.log("Running Test 4: Queue Python Simulation Job");
        const code = "qc = QuantumCircuit(1)";
        const res = await fetchAPI('/api/simulate', 'POST', { code, language: 'python' });
        if (res.status === 200 && res.data.jobId && res.data.queue === 'quantum_jobs') {
            console.log(`✅ Test 4 Passed (Job queued successfully in quantum_jobs)`);
            passed++;
        } else {
            throw new Error(`Unexpected response: ${JSON.stringify(res)}`);
        }
    } catch (e) {
        console.log("❌ Test 4 Failed: " + e.message);
        failed++;
    }

    // 5. C++ Simulation Job Queueing Test
    try {
        console.log("Running Test 5: Queue C++ Simulation Job");
        const code = "int main() { return 0; }";
        const res = await fetchAPI('/api/simulate', 'POST', { code, language: 'cpp' });
        if (res.status === 200 && res.data.jobId && res.data.queue === 'cpp_jobs') {
            console.log(`✅ Test 5 Passed (Job queued successfully in cpp_jobs)`);
            passed++;
        } else {
            throw new Error(`Unexpected response: ${JSON.stringify(res)}`);
        }
    } catch (e) {
        console.log("❌ Test 5 Failed: " + e.message);
        failed++;
    }

    // 6. AI Code Review Test
    try {
        console.log("Running Test 6: AI Code Review Endpoint");
        const res = await fetchAPI('/api/review', 'POST', { code: "print('hello')" });
        if (res.status === 200 && res.data.feedback) {
            console.log(`✅ Test 6 Passed (Feedback: ${res.data.feedback.substring(0, 30)}...)`);
            passed++;
        } else {
            throw new Error(`Unexpected response: ${JSON.stringify(res)}`);
        }
    } catch (e) {
        console.log("❌ Test 6 Failed: " + e.message);
        failed++;
    }

    console.log(`\nTests Completed: ${passed} passed, ${failed} failed.`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
