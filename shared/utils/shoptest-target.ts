import path from 'path';
import fs from 'fs';

export const LOCAL_SHOPTEST_URL = 'http://127.0.0.1:4173';
export const PUBLISHED_SHOPTEST_URL = 'https://stompercito.github.io/web-application-for-automation/';
export const LOCAL_SHOPTEST_REPO_PATH = path.resolve(__dirname, '../../../web-application-for-automation');
export const HAS_LOCAL_SHOPTEST_REPO = fs.existsSync(LOCAL_SHOPTEST_REPO_PATH);
