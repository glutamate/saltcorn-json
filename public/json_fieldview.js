function jsonTableEdit(nm) {
  const obj = {};
  $(`#table-edit-${nm} tr`).each(function (i, row) {
    // reference all the stuff you need first
    const $row = $(row);
    const k = $row.find("input.json_key").val();
    const v = $row.find("input.json_value").val();
    obj[k] = v;
  });
  const s = JSON.stringify(obj);
  $(`#input${nm}`).val(s);
}
