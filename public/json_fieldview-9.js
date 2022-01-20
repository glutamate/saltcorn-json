function getSchemaMap(nm) {
  const s = $(`#table-edit-${nm}`).attr("data-schema-map");
  if (s) return JSON.parse(decodeURIComponent(s));
  else return false;
}

function validID(s) {
  return s ? s.replace(/^[^a-z]+|[^\w:.-]+/gi, "") : s;
}

function initJsonSubfieldEdit(nm, v, key) {
  const $e = $(`#input${validID(nm)}`);
  if ($e.length < 1) {
    $(`#json_subfield_${validID(nm)}_${validID(key)}`).closest("form").append(`
    <textarea name="${validID(nm)}" class="d-none" id="input${validID(nm)}">
    ${JSON.stringify(v)}
    </textarea>
    `);
  }
}

function jsonSubfieldEdit(nm0, key0) {
  const nm = decodeURIComponent(nm0);
  const key = decodeURIComponent(key0);
  const valStr = $(`#input${validID(nm)}`).val();
  const obj = valStr ? JSON.parse(valStr) : {};
  const $e = $(`#json_subfield_${validID(nm)}_${validID(key)}`);
  obj[key] = $e.attr("type") === "checkbox" ? $e.prop("checked") : $e.val();
  const s = JSON.stringify(obj);
  $(`#input${validID(nm)}`).val(s);
}

function jsonTableEdit(nm0) {
  const nm = decodeURIComponent(nm0);

  const schemaMap = getSchemaMap(nm);

  const obj = {};
  $(`#table-edit-${encodeURIComponent(nm)} tr`).each(function (i, row) {
    // reference all the stuff you need first
    const $row = $(row);
    let k;
    const kInput = $row.find("input.json_key,select.json_key");
    if (kInput.length === 0) k = $row.find("th").text();
    else k = kInput.val();

    if (k === "Other...") {
      k = $row.find("input.json_key_other").val();
      $row.find("input.json_key_other").attr("type", "text");
    } else {
      $row.find("input.json_key_other").attr("type", "hidden");
    }
    const velem = $row.find("input.json_value");
    if (schemaMap && schemaMap[k]?.units) {
      $row.find("td:nth-child(2) span.units").html(schemaMap[k].units);
    } else {
      $row.find("td:nth-child(2) span.units").html("");
    }
    if (schemaMap && schemaMap[k] && schemaMap[k].type === "Bool") {
      obj[k] = velem.prop("checked");
      if (velem.attr("type") !== "checkbox")
        velem.replaceWith(
          `<input type="checkbox" class="json_value" onchange="jsonTableEdit('${encodeURIComponent(
            nm
          )}')">`
        );
    } else {
      obj[k] = velem.val();
      if (velem.attr("type") === "checkbox")
        velem.replaceWith(
          `<input type="text" class="json_value" onchange="jsonTableEdit('${encodeURIComponent(
            nm
          )}')" value="">`
        );
    }
  });
  $(`.json_subfield_edit_${validID(nm)}`).each(function (index, item) {
    obj[decodeURIComponent($(item).attr("data-subfield"))] =
      $(item).attr("type") === "checkbox"
        ? $(item).prop("checked")
        : $(item).val();
  });
  const s = JSON.stringify(obj);
  $(`#input${validID(nm)}`).val(s);
}

function jsonTableAddRow(nm) {
  const schemaMap = getSchemaMap(nm);
  let allowUserDefined = false;
  if (schemaMap && schemaMap._allowUserDefined) {
    allowUserDefined = true;
    delete schemaMap._allowUserDefined;
  }
  const schemaKeys = schemaMap && Object.keys(schemaMap);
  const keyInput = schemaMap
    ? `<select class="json_key" onchange="jsonTableEdit('${encodeURIComponent(
        nm
      )}')">
        ${schemaKeys.map((k) => `<option>${k}</option>`).join("")}
        ${allowUserDefined ? `<option>Other...</option>` : ""}
       </select>${
         allowUserDefined
           ? `<input type="hidden" class="json_key_other d-block" onchange="jsonTableEdit('${encodeURIComponent(
               nm
             )}')" value="">`
           : ""
       }`
    : `<input type="text" class="json_key" onchange="jsonTableEdit('${encodeURIComponent(
        nm
      )}')" value="">`;
  const valInput =
    schemaMap && schemaMap[schemaKeys[0]].type === "Bool"
      ? `<input type="checkbox" class="json_value" onchange="jsonTableEdit('${encodeURIComponent(
          nm
        )}')">`
      : `<input type="text" class="json_value" onchange="jsonTableEdit('${encodeURIComponent(
          nm
        )}')" value="">`;
  $(`#table-edit-${encodeURIComponent(nm)}`).append(`
  <tr>
    <td>${keyInput}</td>
    <td>${valInput}<span class="units"></span></td>
    <td><i class="fas fa-times" onclick="jsonTableDeleteRow('${encodeURIComponent(
      nm
    )}', this)"></i></td>
  </tr>
  `);
}

function jsonTableDeleteRow(nm, that) {
  $(that).closest("tr").remove();
  jsonTableEdit(nm);
}
