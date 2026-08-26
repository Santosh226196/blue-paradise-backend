export function frontendJson(schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(_doc, value) {
      delete value._id;
      return value;
    },
  });
}
