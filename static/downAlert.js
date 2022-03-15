

const popup = document.createElement("div");
popup.setAttribute("id", "serverDownAlert");
popup.setAttribute("class", "modal fade");
popup.setAttribute("tabindex", "-1");
popup.setAttribute("area-hidde", true);

const popupDialog = document.createElement("div");
popupDialog.setAttribute("class", "modal-dialog");

const popupContent = document.createElement("div");
popupContent.setAttribute("class", "modal-content");

const popupHeader = document.createElement("div");
popupHeader.setAttribute("class", "modal-header");
const popupHeaderTitle = document.createElement("h5");
popupHeaderTitle.setAttribute("class", "modal-title");
const popupHeaderTitleText = document.createTextNode("The servers are currently down.");
popupHeaderTitle.append(popupHeaderTitleText);
const popupHeaderX = document.createElement("button");
popupHeaderX.setAttribute("type", "button");
popupHeaderX.setAttribute("class", "btn-close");
popupHeaderX.setAttribute("data-bs-dismiss", "modal");
popupHeaderX.setAttribute("aria-label", "Close");
popupHeader.append(popupHeaderTitle);
popupHeader.append(popupHeaderX);
popupContent.append(popupHeader);

const popupBody = document.createElement("div");
popupBody.setAttribute("class", "modal-body");
const popupBodyText = document.createElement("p");
const popupBodyTextNode = document.createTextNode("This may cause some or all arimeisels.com services to stop working. This is most likely because my computer is off (we all know nothing I make ever has bugs). Sorry for the inconvienience!");
popupBodyText.append(popupBodyTextNode);
popupBody.append(popupBodyText);
popupContent.append(popupBody);

const popupFooter = document.createElement("div");
popupFooter.setAttribute("class", "modal-footer");
const popupFooterClose = document.createElement("button");
popupFooterClose.setAttribute("type", "button");
popupFooterClose.setAttribute("class", "btn btn-primary");
popupFooterClose.setAttribute("data-bs-dismiss", "modal");
const popupFooterCloseText = document.createTextNode("OK");
popupFooterClose.append(popupFooterCloseText);
popupFooter.append(popupFooterClose);
popupContent.append(popupFooter);

popupDialog.append(popupContent);
popup.append(popupDialog);

(async () => {
    try {
        await fetch("https://api.imaperson.dev/up");
    }
    catch (e) {
        $(document.body).append(popup);
        $("#serverDownAlert").modal("show");
    }
})();