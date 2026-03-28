import dotenv from 'dotenv';

import { createApp } from './app';

dotenv.config();

const app = createApp();
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on port ${port}`);
});
