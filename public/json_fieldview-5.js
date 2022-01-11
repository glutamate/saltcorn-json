function getSchemaMap(nm) {
  const s = $(`#table-edit-${nm}`).attr("data-schema-map");
  if (s) return JSON.parse(decodeURIComponent(s));
  else return false;
}

function initJsonSubfieldEdit(nm, v, key) {
  const $e = $(`#input${nm}`);
  if ($e.length < 1) {
    $(`#json_subfield_${nm}_${key}`).closest("form").append(`
    <textarea name="${nm}" class="d-none" id="input${nm}">
    ${JSON.stringify(v)}
    </textarea>
    `);
  }
}

function jsonSubfieldEdit(nm, key) {
  const obj = JSON.parse($(`#input${nm}`).val()) || {};
  obj[key] = $(`#json_subfield_${nm}_${key}`).val();
  const s = JSON.stringify(obj);
  $(`#input${nm}`).val(s);
}

function jsonTableEdit(nm) {
  const schemaMap = getSchemaMap(nm);

  const obj = {};
  $(`#table-edit-${nm} tr`).each(function (i, row) {
    // reference all the stuff you need first
    const $row = $(row);
    let k = $row.find("input.json_key,select.json_key").val();
    if (k === "Other...") {
      k = $row.find("input.json_key_other").val();
      $row.find("input.json_key_other").attr("type", "text");
    } else {
      $row.find("input.json_key_other").attr("type", "hidden");
    }
    const velem = $row.find("input.json_value");
    if (schemaMap && schemaMap[k] && schemaMap[k].type === "Bool") {
      obj[k] = velem.prop("checked");
      if (velem.attr("type") !== "checkbox")
        velem.replaceWith(
          `<input type="checkbox" class="json_value" onchange="jsonTableEdit('${nm}')">`
        );
    } else {
      obj[k] = velem.val();
      if (velem.attr("type") === "checkbox")
        velem.replaceWith(
          `<input type="text" class="json_value" onchange="jsonTableEdit('${nm}')" value="">`
        );
    }
  });
  $(`.json_subfield_edit_${nm}`).each(function (index, item) {
    obj[$(item).attr("data-subfield")] = $(item).val();
  });
  const s = JSON.stringify(obj);
  $(`#input${nm}`).val(s);
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
    ? `<select class="json_key" onchange="jsonTableEdit('${nm}')">
        ${schemaKeys.map((k) => `<option>${k}</option>`).join("")}
        ${allowUserDefined ? `<option>Other...</option>` : ""}
       </select>${
         allowUserDefined
           ? `<input type="hidden" class="json_key_other d-block" onchange="jsonTableEdit('${nm}')" value="">`
           : ""
       }`
    : `<input type="text" class="json_key" onchange="jsonTableEdit('${nm}')" value="">`;
  const valInput =
    schemaMap && schemaMap[schemaKeys[0]].type === "Bool"
      ? `<input type="checkbox" class="json_value" onchange="jsonTableEdit('${nm}')">`
      : `<input type="text" class="json_value" onchange="jsonTableEdit('${nm}')" value="">`;
  $(`#table-edit-${nm}`).append(`
  <tr>
    <td>${keyInput}</td>
    <td>${valInput}</td>
    <td><i class="fas fa-times" onclick="jsonTableDeleteRow('${nm}', this)"></i></td>
  </tr>
  `);
}

function jsonTableDeleteRow(nm, that) {
  $(that).closest("tr").remove();
  jsonTableEdit(nm);
}
