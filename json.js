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
  script,
  domReady,
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
    edit_subfield: {
      isEdit: true,
      configFields: [
        {
          name: "key",
          label: "Key",
          type: "String",
        },
      ],
      run: (nm, v, attrs, cls, required, field) =>
        script(
          domReady(
            `initJsonSubfieldEdit("${nm}", ${JSON.stringify(v)}, '${
              attrs.key
            }')`
          )
        ) +
        input({
          type: "text",
          class: `json_subfield_edit_${nm}`,
          "data-subfield": attrs.key,
          id: `json_subfield_${nm}_${attrs.key}`,
          onChange: `jsonSubfieldEdit('${text(nm)}', '${attrs.key}')`,
          value: v ? v[attrs.key] || "" : "",
        }),
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
              Object.entries(v).map(([k, v]) =>
                tr(th(k), td(v === false ? "false" : text(v)))
              )
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
        let schemaKeys = [];
        const hasSchema = attrs && attrs.hasSchema && attrs.schema;
        if (hasSchema) {
          attrs.schema.forEach(({ key, type, units }) => {
            schemaMap[key] = { type, units };
            schemaKeys.push(key);
          });
          if (attrs.allowUserDefined) schemaMap._allowUserDefined = true;
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
                        ),
                        attrs.allowUserDefined &&
                          option(
                            { selected: !schemaKeys.includes(k) },
                            "Other..."
                          )
                      ) +
                        (attrs.allowUserDefined
                          ? input({
                              type: schemaKeys.includes(k) ? "hidden" : "text",
                              class: "json_key_other d-block",
                              onChange: `jsonTableEdit('${text(nm)}')`,
                              value: k,
                            })
                          : "")
                    : input({
                        type: "text",
                        class: "json_key",
                        onChange: `jsonTableEdit('${text(nm)}')`,
                        value: k,
                      })
                ),
                td(
                  hasSchema && schemaMap[k]?.type === "Bool"
                    ? input({
                        type: "checkbox",
                        class: "json_value",
                        onChange: `jsonTableEdit('${text(nm)}')`,
                        checked: v,
                      })
                    : input({
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
          {
            name: "allowUserDefined",
            label: "Allow new keys",
            type: "Bool",
            showIf: { hasSchema: true },
            sublabel:
              "Allow the user to enter a new key that is not in the schema",
          },
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
      if (!attrs || !attrs.hasSchema || !o) return o;
      (attrs.schema || []).map(({ key, type }) => {
        if (key in o)
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
      script: "/plugins/public/json/json_fieldview-4.js",
    },
  ],
};
