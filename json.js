const { textarea, text, code, pre } = require("saltcorn-markup/tags");

const json = {
  name: "JSON",
  sql_name: "jsonb",
  fieldviews: {
    show: { isEdit: false, run: v => pre({ class: "wsprewrap" }, code(JSON.stringify(v))) },
    edit: {
      isEdit: true,
      run: (nm, v, attrs, cls) =>
        textarea(
          {
            class: ["form-control", cls],
            name: text(nm),
            id: `input${text(nm)}`,
            rows: 10
          },
          text(JSON.stringify(v)) || ""
        )
    }
  },
  read: v => {
    switch (typeof v) {
      case "string":
        return JSON.parse(v);
      default:
        return v;
    }
  }
};

module.exports = { types: [json] };
