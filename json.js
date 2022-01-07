const {
  textarea,
  text,
  table,
  th,
  tr,
  td,
  code,
  pre,
  input,
  i,
  button,
  text_attr,
  select,
  option,
} = require("@saltcorn/markup/tags");
const FieldRepeat = require("@saltcorn/data/models/fieldrepeat");
const { features } = require("@saltcorn/data/db/state");
const { int, float } = require("@saltcorn/data/base-plugin/types");

const json = {
  name: "JSON",
  sql_name: "jsonb",
  fieldviews: {
    show: {
      isEdit: false,
      run: (v) => pre({ class: "wsprewrap" }, code(JSON.stringify(v))),
    },
    subfield: {
      isEdit: false,
      configFields: [
        {
          name: "key",
          label: "Key",
          type: "String",
        },
      ],
      run: (v, req, options) => {
        if (
          options &&
          options.key &&
          v &&
          typeof v[options.key] !== "undefined"
        )
          return text_attr(v[options.key]);
        else return "";
      },
    },
    pretty: {
      isEdit: false,
      run: (v) => pre({ class: "wsprewrap" }, code(JSON.stringify(v, null, 2))),
    },
    show_table: {
      isEdit: false,
      run: (v) => {
        return typeof v !== "object" || !v
          ? ""
          : table(
              { class: "table table-sm" },
              Object.entries(v).map(([k, v]) => tr(th(k), td(v)))
            );
      },
    },
    edit: {
      isEdit: true,
      run: (nm, v, attrs, cls) =>
        textarea(
          {
            class: ["form-control", cls],
            name: text(nm),
            id: `input${text(nm)}`,
            rows: 10,
          },
          text(JSON.stringify(v)) || ""
        ),
    },
    edit_table: {
      isEdit: true,
      run: (nm, v, attrs, cls) => {
        //console.log(attrs);
        const schemaMap = {};
        const hasSchema = attrs && attrs.hasSchema && attrs.schema;
        if (hasSchema) {
          attrs.schema.forEach(({ key, type, units }) => {
            schemaMap[key] = { type, units };
          });
        }
        return (
          textarea(
            {
              class: "d-none",
              name: text(nm),
              id: `input${text(nm)}`,
            },
            text(JSON.stringify(v)) || ""
          ) +
          table(
            {
              class: "table table-sm json-table-edit",
              id: `table-edit-${text(nm)}`,
              "data-schema-map": hasSchema
                ? encodeURIComponent(JSON.stringify(schemaMap))
                : undefined,
            },
            Object.entries(v || {}).map(([k, v]) =>
              tr(
                td(
                  hasSchema
                    ? select(
                        {
                          class: "json_key",
                          onChange: `jsonTableEdit('${text(nm)}')`,
                        },
                        attrs.schema.map(({ key }) =>
                          option({ selected: key === k }, key)
                        )
                      )
                    : input({
                        type: "text",
                        class: "json_key",
                        onChange: `jsonTableEdit('${text(nm)}')`,
                        value: k,
                      })
                ),
                td(
                  hasSchema &&
                    input({
                      type: "text",
                      class: "json_value",
                      onChange: `jsonTableEdit('${text(nm)}')`,
                      value: v,
                    })
                ),
                td(
                  i({
                    class: "fas fa-times",
                    onClick: `jsonTableDeleteRow('${text(nm)}', this)`,
                  })
                )
              )
            )
          ) +
          button(
            {
              class: "btn btn-primary btn-sm",
              type: "button",
              onClick: `jsonTableAddRow('${text(nm)}')`,
            },
            "Add entry"
          )
        );
      },
    },
  },
  attributes:
    features && features.fieldrepeats_in_field_attributes
      ? [
          { name: "hasSchema", label: "Has Schema", type: "Bool" },
          new FieldRepeat({
            name: "schema",
            label: "Schema",
            showIf: { hasSchema: true },
            fields: [
              { name: "key", label: "Key", type: "String" },
              {
                name: "type",
                label: "Type",
                type: "String",
                required: true,
                attributes: { options: ["String", "Integer", "Float", "Bool"] },
              },
              {
                name: "units",
                label: "Units",
                type: "String",
                showIf: { type: "Float" },
              },
            ],
          }),
        ]
      : [],
  read: (v, attrs) => {
    const alignSchema = (o) => {
      if (!attrs || !attrs.hasSchema) return o;
      (attrs.schema || []).map(({ key, type }) => {
        switch (type) {
          case "Integer":
            o[key] = Math.round(+o[key]);
            break;
          case "Float":
            o[key] = +o[key];
            break;
          case "Bool":
            if (o[key] === "false") o[key] = false;
            else o[key] = !!o[key];
            break;
          default:
            break;
        }
      });
      return o;
    };
    switch (typeof v) {
      case "string":
        try {
          return alignSchema(JSON.parse(v));
        } catch {
          return undefined;
        }
      default:
        return alignSchema(v);
    }
  },
};

module.exports = {
  sc_plugin_api_version: 1,
  types: [json],
  plugin_name: "json",

  headers: [
    {
      script: "/plugins/public/json/json_fieldview-1.js",
    },
  ],
};
