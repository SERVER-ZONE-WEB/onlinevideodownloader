const request = require('supertest');
const app = require('../server');

describe('Security Tests', () => {
    test('Should have security headers', async () => {
        const response = await request(app).get('/');
        expect(response.headers['x-xss-protection']).toBeDefined();
        expect(response.headers['x-content-type-options']).toBeDefined();
        expect(response.headers['x-frame-options']).toBeDefined();
    });

    test('Rate limiting should work', async () => {
        for (let i = 0; i < 101; i++) {
            const response = await request(app).get('/');
            if (i === 100) {
                expect(response.status).toBe(429);
            }
        }
    });
});
