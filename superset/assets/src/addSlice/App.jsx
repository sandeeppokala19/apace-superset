import React from 'react';
import { hot } from 'react-hot-loader';
import setupApp from '../setup/setupApp';
import AddSliceContainer from './AddSliceContainer';

setupApp();

const addSliceContainer = document.getElementById('js-add-slice-container');
const bootstrapData = JSON.parse(addSliceContainer.getAttribute('data-bootstrap'));

const App = () => (
  <AddSliceContainer datasources={bootstrapData.datasources} />
);

export default hot(module)(App);
