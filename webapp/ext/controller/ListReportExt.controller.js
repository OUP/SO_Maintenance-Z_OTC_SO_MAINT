sap.ui.define(
  ["sap/m/MessageBox", "sap/m/MessageToast"],
  function (MessageBox, MessageToast) {
    "use strict";
    let _sIdPrefix;

    return {
      onInit: function () {
        _sIdPrefix =
          "oup.otc.zsomaintenance::sap.suite.ui.generic.template.ListReport.view.ListReport::ZOTC_C_SO_MAINTENANCE--";

        let oListReport = this.byId(_sIdPrefix + "listReport");
        oListReport.setShowFullScreenButton(true);

        // prototype methods
        Date.prototype.isValid = function () {
          // An invalid date object returns NaN for getTime() and NaN is the only
          // object not strictly equal to itself.
          return this.getTime() === this.getTime();
        };
      },

      onAfterRendering: function () {
        const oContentTable = this.byId(_sIdPrefix + "GridTable");
        oContentTable.attachBusyStateChanged(this._onBusyStateChanged);
      },

      _onBusyStateChanged: function (oEvent) {
        const bBusy = oEvent.getParameter("busy");
        if (!bBusy) {
          const oTable = oEvent.getSource();
          let oTpc = null;

          // grid table
          if (sap.ui.table.TablePointerExtension) {
            oTpc = new sap.ui.table.TablePointerExtension(oTable);
          } else {
            oTpc = new sap.ui.table.extensions.Pointer(oTable);
          }

          // columns
          const aColumns = oTable.getColumns();
          for (let i = aColumns.length; i >= 0; i--) {
            oTpc.doAutoResizeColumn(i);
          }
          aColumns[aColumns.length - 1].setWidth("150px");
        }
      },

      onReject: function (_oEvent) {
        const oView = this.getView();
        const oModel = oView.getModel();
        const oTable = this.byId(_sIdPrefix + "GridTable");
        const oPlugins = oTable.getPlugins()[0];
        const aSelectedIndex = oPlugins.getSelectedIndices();
        let sKey = "";
        let oContext, oRowData, sFormattedDate;

        const fnDateFormat = (oDate) => {
          let sValue = "";

          if (oDate && oDate.isValid()) {
            const sDate = oDate.getDate().toString().padStart(2, 0);
            const sMonth = (oDate.getMonth() + 1).toString().padStart(2, 0);
            const sYear = oDate.getFullYear();

            // YYYYMMDD
            sValue = sYear + sMonth + sDate;
          }

          return sValue;
        };

        for (let i = 0, iLen = aSelectedIndex.length; i < iLen; i++) {
          oContext = oTable.getContextByIndex(aSelectedIndex[i]);
          oRowData = oContext.getObject() || null;
          sFormattedDate = fnDateFormat(oRowData.FSH_CANDATE);

          // formated
          sKey += `${oRowData.vbeln}-${oRowData.posnr}-${oRowData.ABGRU_VA}-${sFormattedDate}|`;
        }

        // function import to create PO / contract
        oModel.callFunction("/REJECT", {
          method: "POST",
          urlParameters: {
            bp_vbeln_posnr: sKey,
          },
          success: function (oData, _oResponse) {
            // success message
            // message toast
            MessageToast.show(oData.Message);
          },
          error: function (_oError) {
            try {
              // read error message
              const sResponseText = _oError.responseText;
              const oResponse = JSON.parse(sResponseText);
              const sErrorText = oResponse.error.message.value;

              // size compact
              const bCompact = !!oView.$().closest(".sapUiSizeCompact").length;

              // error message
              MessageBox.error(sErrorText, {
                styleClass: bCompact ? "sapUiSizeCompact" : "",
              });
            } catch (error) {
              // unable to read error message
            }
          },
        });
      },
    };
  }
);
