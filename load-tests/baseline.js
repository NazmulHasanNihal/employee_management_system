import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  let res = http.get(`${BASE_URL}/login`);
  check(res, { 'login page 200': (r) => r.status === 200 });
  sleep(1);

  res = http.get(`${BASE_URL}/api/audit`);
  check(res, { 'audit route 401/200': (r) => [200, 401].includes(r.status) });
  sleep(1);

  res = http.get(`${BASE_URL}/api/cron/greetings`);
  check(res, { 'greetings cron 401/200': (r) => [200, 401].includes(r.status) });
  sleep(1);
}
