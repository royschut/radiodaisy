import React, { Suspense } from "react";
import { HashRouter, Route, Switch } from "react-router-dom";

//Daisy components
import "./App.css";
import RadioDaisy from "./RadioDaisy";
const Backend = React.lazy(() => import("./Backend"));

class App extends React.Component {
  render() {
    return (
      <HashRouter>
        <Switch>
          <Route path="/" component={RadioDaisy} exact />
          <Route path="/backend" exact>
            <Suspense fallback={<div>Loading backend...</div>}>
              <Backend />
            </Suspense>
          </Route>
          <Route path="/:id" component={RadioDaisy} />
        </Switch>
      </HashRouter>
    );
  }
}
export default App;
