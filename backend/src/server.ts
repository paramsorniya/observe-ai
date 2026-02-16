import app from './app.js';
import { config } from './utils/config.js';
import { startScheduler } from './jobs/scheduler.js';

const port = parseInt(config.PORT, 10);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startScheduler();
});
