import { injectJsError } from "./lib/jsError";
import { injectXHR } from "./lib/xhr";
import { injectFetch } from "./lib/fetch";
import { blankScreen } from "./lib/blankScreen";
import { timing } from "./lib/timing";
import { longTask } from "./lib/longTask";
import { pv } from "./lib/pv";

injectJsError();
injectXHR();
injectFetch();
blankScreen();
timing();
longTask();
pv();
