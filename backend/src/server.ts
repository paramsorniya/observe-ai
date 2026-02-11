import app from './app.js';
import { config } from './utils/config.js';

const port = parseInt(config.PORT, 10);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
