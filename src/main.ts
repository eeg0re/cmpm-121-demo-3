// todo
import "./style.css";

const APP_NAME = "GeoCoin";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
app.innerHTML = APP_NAME;

const header = document.createElement("h1");
app.append(header);

const tempButton = document.createElement("button");
tempButton.innerHTML = "Click me";
app.append(tempButton);

tempButton.addEventListener("click", () => {
  alert("you clicked the button");
});
