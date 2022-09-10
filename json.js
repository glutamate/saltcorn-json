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
  section,
} = require("@saltcorn/markup/tags");
const FieldRepeat = require("@saltcorn/data/models/fieldrepeat");
const { features, getState } = require("@saltcorn/data/db/state");

const getSchemaMap = (attrs) => {
  const schemaMap = {};
  let schemaKeys = [];
  const hasSchema = attrs && attrs.hasSchema && attrs.schema;
  if (hasSchema) {
    attrs.schema.forEach(({ key, ...rest }) => {
      schemaMap[key] = rest;
      schemaKeys.push(key);
    });
    if (attrs.allowUserDefined) schemaMap._allowUserDefined = true;
    if (attrs.all_keys) schemaMap._all_keys = true;
  }
  return { hasSchema, schemaMap, schemaKeys };
};

const isdef = (x) => (typeof x === "undefined" || x === null ? false : true);


const showUnits = (schemaMap, k) =>
  nbsp + span({ class: "units" }, (schemaMap && schemaMap[k]?.units) || "");

//https://stackoverflow.com/a/9635698
function validID(s) {
  return s
    ? s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^[^a-z]+|[^\w:.-]+/gi, "")
    : s;
}
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
              attributes: { options: ["", ...schemaKeys] },
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
              attributes: { options: ["", ...schemaKeys] },
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
          (hasSchema && schemaMap[attrs.key]?.options ?
            select(
              {
                class: `json_subfield_edit_${validID(nm)}`,
                "data-subfield": encode(attrs.key),
                id: `json_subfield_${validID(nm)}_${validID(attrs.key)}`,
                onChange: `jsonSubfieldEdit('${encode(nm)}', '${encode(
                  attrs.key
                )}')`,
                value: v ? v[attrs.key] || "" : "",
              },
              option({ selected: !(v?.[attrs.key]) }, ""),
              schemaMap[attrs.key].options.split(",").map(o => option({ selected: v?.[attrs.key] === o.trim() }, o.trim()))
            ) :
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
            })) +
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
          typeof v === "undefined" ? "" : text(JSON.stringify(v)) || ""
        ),
    },
    edit_table: {
      isEdit: true,
      configFields: (field) => {
        const { hasSchema, schemaKeys } = getSchemaMap(field.attributes);
        return hasSchema
          ? [
            {
              name: "all_keys",
              label: "All keys",
              type: "Bool",
            },
          ]
          : [];
      },
      run: (nm, v, attrs, cls) => {
        //console.log(attrs);
        const { hasSchema, schemaMap, schemaKeys } = getSchemaMap(attrs);
        const rndid = Math.floor(Math.random() * 16777215).toString(16);
        const valueInput = (k, val) => schemaMap[k]?.type === "Bool"
          ? input({
            type: "checkbox",
            class: "json_value",
            onChange: `jsonTableEdit('${encode(
              nm
            )}', '${rndid}')`,
            checked: val,
          })
          : schemaMap[k]?.type === "Calculation"
            ? input({
              type: "text",
              class: "json_calculation",
              "data-key": k,
              "data-formula": encodeURIComponent(schemaMap[k].formula),
              value: val,
              readonly: true
            })
            : (schemaMap[k]?.type || "").startsWith("Key to ")
              ? select({
                class: "json_value",
                onChange: `jsonTableEdit('${encode(
                  nm
                )}', '${rndid}')`,
                value: val,
                "data-selected": val,
                "data-fetch-options": encodeURIComponent(
                  JSON.stringify({
                    table: schemaMap[k].type.replace("Key to ", ""),
                    summary_field: schemaMap[k].summary_field,
                    refname: "id",
                    whereParsed: {}
                  })
                ),

              })
              : schemaMap[k]?.options
                ? select({
                  class: "json_value",
                  onChange: `jsonTableEdit('${encode(
                    nm
                  )}', '${rndid}')`,
                  value: val,
                },
                  option({ selected: !(val) }, ""),
                  schemaMap[k].options.split(",").map(o => option({ selected: val === o.trim() }, o.trim()))
                )
                : schemaMap[k]?.type === "Integer" || schemaMap[k]?.type === "Float"
                  ? input({
                    type: "number",
                    class: "json_value",
                    onChange: `jsonTableEdit('${encode(
                      nm
                    )}', '${rndid}')`,
                    value: val,
                  }) + showUnits(schemaMap, k)
                  : input({
                    type: "text",
                    class: "json_value",
                    onChange: `jsonTableEdit('${encode(
                      nm
                    )}', '${rndid}')`,
                    value: val,
                  }) + showUnits(schemaMap, k)
        return (
          script(
            domReady(
              `initJsonTableEdit(${JSON.stringify(
                nm
              )}, '${rndid}', ${JSON.stringify(v)})`
            )
          ) +
          table(
            {
              class: `table table-sm json-table-edit table-edit-${validID(nm)}`,
              id: `table-edit-${validID(nm)}-${rndid}`,
              "data-schema-map": hasSchema
                ? encodeURIComponent(JSON.stringify(schemaMap))
                : undefined,
            },
            hasSchema && attrs.all_keys
              ? [...new Set([...schemaKeys, ...Object.keys(v || {})])].map(
                (k) =>
                  tr(
                    th(k),
                    td(valueInput(k, (v || {})[k]))
                  )
              )
              : Object.entries(v || {}).map(([k, v]) =>
                tr(
                  td(
                    hasSchema
                      ? select(
                        {
                          class: "json_key",
                          onChange: `jsonTableEdit('${encodeURIComponent(
                            nm
                          )}', '${rndid}')`,
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
                          type: schemaKeys.includes(k)
                            ? "hidden"
                            : "text",
                          class: "json_key_other d-block",
                          onChange: `jsonTableEdit('${encode(
                            nm
                          )}', '${rndid}')`,
                          value: k,
                        })
                        : "")
                      : input({
                        type: "text",
                        class: "json_key",
                        onChange: `jsonTableEdit('${encode(
                          nm
                        )}', '${rndid}')`,
                        value: k,
                      })
                  ),
                  td(valueInput(k, v)),
                  td(
                    i({
                      class: "fas fa-times",
                      onClick: `jsonTableDeleteRow('${encode(
                        nm
                      )}','${rndid}', this)`,
                    })
                  )
                )
              )
          ) +
          (hasSchema && attrs.all_keys && !attrs.allowUserDefined
            ? ""
            : button(
              {
                class: "btn btn-primary btn-sm",
                type: "button",
                onClick: `jsonTableAddRow('${encode(nm)}', '${rndid}')`,
              },
              "Add entry"
            ))
        );
      },
    },
    keys_expand_columns: {
      isEdit: false,
      configFields: (field) => {
        const { hasSchema, schemaKeys } = getSchemaMap(field.attributes);

        return hasSchema
          ? schemaKeys.map((k) => ({
            name: k,
            label: k,
            type: "Bool",
          }))
          : [
            {
              name: "keys",
              label: "Keys",
              type: "String",
              sublabel: "Separate keys by commas",
            },
          ];
      },
      expandColumns: (field, attributes, column) => {
        const { hasSchema, schemaKeys } = getSchemaMap(field.attributes);
        let field_name = column.field_name;

        if (!field_name && column.join_field) {
          const path = column.join_field.split(".");
          field_name = path.join("_");
        }

        const getCol = (k) => ({
          label: column.header_label ? `${column.header_label} ${k}` : k,
          row_key: [field_name, k],
          key: (r) =>
            field_name && typeof r[field_name]?.[k] !== "undefined"
              ? r[field_name]?.[k]
              : "",
        });
        return hasSchema
          ? schemaKeys.filter((k) => attributes[k]).map(getCol)
          : attributes.keys
            .split()
            .map((s) => s.trim())
            .map(getCol);
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
    ...(features?.json_state_query
      ? {
        jsonRangeFilter: {
          configFields: (field) => {
            const { hasSchema, schemaKeys } = getSchemaMap(field.attributes);
            return [
              {
                name: "key",
                label: "Key",
                type: "String",
                required: true,
                attributes: schemaKeys
                  ? { options: ["", ...schemaKeys] }
                  : undefined,
              },
              { name: "min", type: "Float", required: false },
              { name: "max", type: "Float", required: false },
            ];
          },
          isEdit: false,
          isFilter: true,
          blockDisplay: true,
          /* https://stackoverflow.com/a/31083391 */
          run: (nm, v, attrs = {}, cls, required, field, state = {}) => {
            const stateKeyLte = encodeURIComponent(`${nm}[${attrs.key}__lte]`);
            const stateKeyGte = encodeURIComponent(`${nm}[${attrs.key}__gte]`);
            const stateValueLte = state[nm]?.[`${attrs.key}__lte`];
            const stateValueGte = state[nm]?.[`${attrs.key}__gte`];
            return section(
              { class: ["range-slider", cls] },
              span({ class: "rangeValues" }),
              input({
                ...(isdef(stateValueGte)
                  ? {
                    value: text_attr(stateValueGte),
                  }
                  : isdef(attrs.min)
                    ? { value: text_attr(attrs.min) }
                    : {}),
                ...(isdef(attrs.max) && { max: attrs.max }),
                ...(isdef(attrs.min) && { min: attrs.min }),
                type: "range",
                disabled: attrs.disabled,
                onChange: `set_state_field('${stateKeyGte}', this.value)`,
              }),
              input({
                ...(isdef(stateValueLte)
                  ? {
                    value: text_attr(stateValueLte),
                  }
                  : isdef(attrs.max)
                    ? { value: text_attr(attrs.max) }
                    : {}),
                ...(isdef(attrs.max) && { max: attrs.max }),
                ...(isdef(attrs.min) && { min: attrs.min }),
                type: "range",
                disabled: attrs.disabled,
                onChange: `set_state_field('${stateKeyLte}', this.value)`,
              })
            );
          },
        },
        jsonFilter: {
          isEdit: false,
          isFilter: true,
          configFields: (field) => {
            const { hasSchema, schemaKeys } = getSchemaMap(field.attributes);
            return hasSchema
              ? [
                {
                  name: "key",
                  label: "Key",
                  type: "String",
                  required: true,
                  attributes: { options: ["", ...schemaKeys] },
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
          run: (nm, v, attrs, cls, required, field, state = {}) => {
            const { hasSchema, schemaMap } = getSchemaMap(attrs);
            const stateKey = encodeURIComponent(`${nm}[${attrs.key}]`);
            const stateValue = state[nm]?.[attrs.key];
            return (
              input({
                type:
                  hasSchema && schemaMap[attrs.key]?.type === "Bool"
                    ? "checkbox"
                    : "text",
                onChange: `set_state_field('${stateKey}', this.value)`,
                value: stateValue || "",
                checked:
                  (hasSchema &&
                    schemaMap[attrs.key]?.type === "Bool" &&
                    stateKey) ||
                  false,
              }) + showUnits(schemaMap, attrs.key)
            );
          },
        },
      }
      : {}),
  },
  attributes:
    features && features.fieldrepeats_in_field_attributes
      ? () => {
        const tables = getState().tables
        const typeOpts = ["String", "Integer", "Float", "Bool", "Calculation"]
        const fkeyOptions = []
        const sumFieldOptions = {}
        tables.forEach(t => {
          typeOpts.push(`Key to ${t.name}`)
          fkeyOptions.push(`Key to ${t.name}`)
          sumFieldOptions[`Key to ${t.name}`] = t.fields.map(f => f.name)
        })
        return [
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
                attributes: { options: typeOpts },
              },
              {
                name: "formula",
                label: "Formula",
                class: "validate-expression",
                type: "String",
                showIf: { type: "Calculation" },
              },
              {
                name: "summary_field",
                label: "Summary field",
                type: "String",
                showIf: { type: fkeyOptions },
                attributes: {
                  calcOptions: ["type", sumFieldOptions],
                },
              },
              {
                name: "units",
                label: "Units",
                type: "String",
                showIf: { type: "Float" },
              },
              {
                name: "options",
                label: "Options",
                type: "String",
                required: false,
                sublabel:
                  'Use this to restrict your field to a list of options (separated by commas). For instance, if the permissible values are "Red", "Green" and "Blue", enter "Red, Green, Blue" here. Leave blank if the string can hold any value.',
                showIf: { type: "String" },
              },
            ],
          }),
        ]
      }
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
      script: `/plugins/public/json${features?.version_plugin_serve_path
        ? "@" + require("./package.json").version
        : ""
        }/json_fieldview.js`,
    },
  ],
};
