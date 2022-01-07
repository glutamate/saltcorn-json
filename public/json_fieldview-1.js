function getSchemaMap(nm) {
  const s = $(`#table-edit-${nm}`).attr("data-schema-map");
  if (s) return JSON.parse(decodeURIComponent(s));
  else return false;
}

function jsonTableEdit(nm) {
  const obj = {};
  $(`#table-edit-${nm} tr`).each(function (i, row) {
    // reference all the stuff you need first
    const $row = $(row);
    const k = $row.find("input.json_key,select.json_key").val();
    const v = $row.find("input.json_value").val();
    obj[k] = v;
  });
  const s = JSON.stringify(obj);
  $(`#input${nm}`).val(s);
}

function jsonTableAddRow(nm) {
  const schemaMap = getSchemaMap(nm);

  const keyInput = schemaMap
    ? `<select class="json_key" onchange="jsonTableEdit('${nm}')">
        ${Object.keys(schemaMap)
          .map((k) => `<option>${k}</option>`)
          .join("")}
       </select>`
    : `<input type="text" class="json_key" onchange="jsonTableEdit('${nm}')" value="">`;
  $(`#table-edit-${nm}`).append(`
  <tr>
    <td>${keyInput}</td>
    <td><input type="text" class="json_value" onchange="jsonTableEdit('${nm}')" value=""></td>
    <td><i class="fas fa-times" onclick="jsonTableDeleteRow('${nm}', this)"></i></td>
  </tr>
  `);
}

function jsonTableDeleteRow(nm, that) {
  $(that).closest("tr").remove();
  jsonTableEdit(nm);
}
