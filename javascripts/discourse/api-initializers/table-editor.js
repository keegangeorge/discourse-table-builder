import { apiInitializer } from "discourse/lib/api";
import showModal from "discourse/lib/show-modal";
import { schedule } from "@ember/runloop";
import I18n from "I18n";
import { iconNode } from "discourse-common/lib/icon-library";
import { create } from "virtual-dom";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
export default apiInitializer("0.11.1", (api) => {
  const site = api.container.lookup("site:main");
  const currentUser = api.getCurrentUser();

  function createButton() {
    const openPopupBtn = document.createElement("button");
    openPopupBtn.classList.add(
      "open-popup-link",
      "btn-default",
      "btn",
      "btn-icon-text"
    );
    const editIcon = create(
      iconNode("pencil-alt", { class: "edit-table-icon" })
    );
    const openPopupText = document.createTextNode(
      I18n.t(themePrefix("discourse_table_builder.edit.btn_edit"))
    );
    openPopupBtn.append(editIcon, openPopupText);
    return openPopupBtn;
  }

  function generateModal(event) {
    const table = event.target.parentNode.lastElementChild;
    const tempTable = table.cloneNode(true);
    const tableId = event.target.getAttribute("data-table-id");

    return ajax(`/posts/${this.id}`, { type: "GET" })
      .then((post) => {
        showModal("insert-table-modal", {
          model: post,
        }).setProperties({
          tableHtml: tempTable,
          tableId,
        });
      })
      .catch(popupAjaxError);
  }

  function generatePopups(tables, attrs) {
    tables.forEach((table, index) => {
      if (site.isMobileDevice) {
        return;
      }

      const popupBtn = createButton();
      popupBtn.setAttribute("data-table-id", index); // sets a table id so each table can be distinctly edited
      table.parentNode.classList.add("fullscreen-table-wrapper");
      const expandBtn = table.parentNode.querySelector(".open-popup-link");

      if (table.parentNode.contains(expandBtn)) {
        expandBtn.parentNode.insertBefore(popupBtn, expandBtn);
      } else {
        table.parentNode.insertBefore(popupBtn, table);
      }

      popupBtn.addEventListener("click", generateModal.bind(attrs), false);
    });
  }

  api.decorateCookedElement(
    (post, helper) => {
      const postOwner = helper.widget.attrs.username;

      if (postOwner !== currentUser.username) {
        return;
      }

      schedule("afterRender", () => {
        const tables = post.querySelectorAll("table");
        generatePopups(tables, helper.widget.attrs);
      });
    },
    {
      onlyStream: true,
      id: "edit-table",
    }
  );
});
