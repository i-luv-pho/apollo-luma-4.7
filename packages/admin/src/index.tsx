/* @refresh reload */
import { render } from "solid-js/web"
import { Router, Route } from "@solidjs/router"
import "./index.css"

import Layout from "./components/Layout"
import Overview from "./pages/Overview"
import Users from "./pages/Users"
import Revenue from "./pages/Revenue"
import Usage from "./pages/Usage"
import Settings from "./pages/Settings"
import Keys from "./pages/Keys"

render(
  () => (
    <Router root={Layout}>
      <Route path="/" component={Overview} />
      <Route path="/users" component={Users} />
      <Route path="/revenue" component={Revenue} />
      <Route path="/usage" component={Usage} />
      <Route path="/keys" component={Keys} />
      <Route path="/settings" component={Settings} />
    </Router>
  ),
  document.getElementById("app")!
)
