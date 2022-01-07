function getSchemaMap(nm) {
  const s = $(`#table-edit-${nm}`).attr("data-schema-map");
  if (s) return JSON.parse(decodeURIComponent(s));
  else return false;
}

function jsonTableEdit(nm) {
  const schemaMap = getSchemaMap(nm);

  const obj = {};
  $(`#table-edit-${nm} tr`).each(function (i, row) {
    // reference all the stuff you need first
    const $row = $(row);
    const k = $row.find("input.json_key,select.json_key").val();
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
  const s = JSON.stringify(obj);
  $(`#input${nm}`).val(s);
}

function jsonTableAddRow(nm) {
  const schemaMap = getSchemaMap(nm);
  const schemaKeys = schemaMap && Object.keys(schemaMap);
  const keyInput = schemaMap
    ? `<select class="json_key" onchange="jsonTableEdit('${nm}')">
        ${schemaKeys.map((k) => `<option>${k}</option>`).join("")}
       </select>`
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
