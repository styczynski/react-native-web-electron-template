/* global document */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { PersistGate } from 'redux-persist/es/integration/react';

import configureStore from '../store/index';
import registerServiceWorker from '../web/register-service-worker';
import Routes from '../web/routes/index';

// Components
import Loading from '../web/components/Loading';

// Load css
require('../web/styles/style.scss');

const { persistor, store } = configureStore();
// persistor.purge(); // Debug to clear persist

const rootElement = document.createElement("div"); 
document.body.appendChild(rootElement);

const Root = () => (
  <Provider store={store}>
    <PersistGate loading={<Loading />} persistor={persistor}>
      <Router>
        <Routes />
      </Router>
    </PersistGate>
  </Provider>
);

render(<Root />, rootElement);
registerServiceWorker();
