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
  span,
  nbsp,
} = require("@saltcorn/markup/tags");
const FieldRepeat = require("@saltcorn/data/models/fieldrepeat");
const { features } = require("@saltcorn/data/db/state");

const getSchemaMap = (attrs) => {
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
  return { hasSchema, schemaMap, schemaKeys };
};

const showUnits = (schemaMap, k) =>
  nbsp + span({ class: "units" }, (schemaMap && schemaMap[k]?.units) || "");

//https://stackoverflow.com/a/9635698
const validID = (s) => (s ? s.replace(/^[^a-z]+|[^\w:.-]+/gi, "") : s);
const encode = (s) => (s ? encodeURIComponent(s).replace(/'/g, "%27") : s);
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
      configFields: (field) => {
        const { hasSchema, schemaKeys } = getSchemaMap(field.attributes);

        return hasSchema
          ? [
              {
                name: "key",
                label: "Key",
                type: "String",
                required: true,
                attributes: { options: schemaKeys },
              },
            ]
          : [
              {
                name: "key",
                label: "Key",
                type: "String",
              },
            ];
      },
      run: (v, req, options) => {
        const { schemaMap } = getSchemaMap(options);
        if (
          options &&
          options.key &&
          v &&
          typeof v[options.key] !== "undefined"
        )
          return text_attr(v[options.key]) + showUnits(schemaMap, options.key);
        else return "";
      },
    },
    edit_subfield: {
      isEdit: true,
      configFields: (field) => {
        const { hasSchema, schemaKeys } = getSchemaMap(field.attributes);
        return hasSchema
          ? [
              {
                name: "key",
                label: "Key",
                type: "String",
                required: true,
                attributes: { options: schemaKeys },
              },
            ]
          : [
              {
                name: "key",
                label: "Key",
                type: "String",
              },
            ];
      },
      run: (nm, v, attrs, cls, required, field) => {
        const { hasSchema, schemaMap } = getSchemaMap(attrs);

        return (
          script(
            domReady(
              `initJsonSubfieldEdit(${JSON.stringify(nm)}, ${JSON.stringify(
                v
              )}, ${JSON.stringify(attrs.key)})`
            )
          ) +
          input({
            type:
              hasSchema && schemaMap[attrs.key]?.type === "Bool"
                ? "checkbox"
                : "text",
            class: `json_subfield_edit_${validID(nm)}`,
            "data-subfield": encode(attrs.key),
            id: `json_subfield_${validID(nm)}_${validID(attrs.key)}`,
            onChange: `jsonSubfieldEdit('${encode(nm)}', '${encode(
              attrs.key
            )}')`,
            value: v ? v[attrs.key] || "" : "",
            checked:
              hasSchema &&
              schemaMap[attrs.key]?.type === "Bool" &&
              v &&
              v[attrs.key],
          }) +
          showUnits(schemaMap, attrs.key)
        );
      },
    },
    pretty: {
      isEdit: false,
      run: (v) => pre({ class: "wsprewrap" }, code(JSON.stringify(v, null, 2))),
    },
    show_table: {
      isEdit: false,
      run: (v, req, options) => {
        const { schemaMap } = getSchemaMap(options);

        return typeof v !== "object" || !v
          ? ""
          : table(
              { class: "table table-sm" },
              Object.entries(v).map(([k, v]) =>
                tr(
                  th(k),
                  td(v === false ? "false" : text(v) + showUnits(schemaMap, k))
                )
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
            name: encodeURIComponent(nm),
            id: `input${encodeURIComponent(nm)}`,
            rows: 10,
          },
          text(JSON.stringify(v)) || ""
        ),
    },
    edit_table: {
      isEdit: true,
      run: (nm, v, attrs, cls) => {
        //console.log(attrs);
        const { hasSchema, schemaMap, schemaKeys } = getSchemaMap(attrs);
        return (
          textarea(
            {
              class: "d-none",
              name: text(nm),
              id: `input${encode(nm)}`,
            },
            text(JSON.stringify(v)) || ""
          ) +
          table(
            {
              class: "table table-sm json-table-edit",
              id: `table-edit-${validID(nm)}`,
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
                          onChange: `jsonTableEdit('${encodeURIComponent(
                            nm
                          )}')`,
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
                              onChange: `jsonTableEdit('${encode(nm)}')`,
                              value: k,
                            })
                          : "")
                    : input({
                        type: "text",
                        class: "json_key",
                        onChange: `jsonTableEdit('${encode(nm)}')`,
                        value: k,
                      })
                ),
                td(
                  hasSchema && schemaMap[k]?.type === "Bool"
                    ? input({
                        type: "checkbox",
                        class: "json_value",
                        onChange: `jsonTableEdit('${encode(nm)}')`,
                        checked: v,
                      })
                    : input({
                        type: "text",
                        class: "json_value",
                        onChange: `jsonTableEdit('${encode(nm)}')`,
                        value: v,
                      }) + showUnits(schemaMap, k)
                ),
                td(
                  i({
                    class: "fas fa-times",
                    onClick: `jsonTableDeleteRow('${encode(nm)}', this)`,
                  })
                )
              )
            )
          ) +
          button(
            {
              class: "btn btn-primary btn-sm",
              type: "button",
              onClick: `jsonTableAddRow('${encode(nm)}')`,
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
      script: "/plugins/public/json/json_fieldview-9.js",
    },
  ],
};
