const notFound = (label) => Object.assign(new Error(`${label} not found`), { statusCode: 404 });

export function crudController(Model, label, { listFilter, createDefaults, sort = { createdAt: -1 } } = {}) {
  return {
    list: async (req, res) => {
      const filter = listFilter ? listFilter(req) : {};
      res.json(await Model.find(filter).sort(sort));
    },
    get: async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw notFound(label);
      res.json(item);
    },
    create: async (req, res) => {
      const defaults = createDefaults ? await createDefaults(req) : {};
      const item = await Model.create({ ...req.body, ...defaults, _id: undefined, id: undefined });
      res.status(201).json(item);
    },
    update: async (req, res) => {
      const { id: _id, _id: mongoId, createdAt, updatedAt, ...changes } = req.body;
      void _id; void mongoId; void createdAt; void updatedAt;
      const item = await Model.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
      if (!item) throw notFound(label);
      res.json(item);
    },
    remove: async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) throw notFound(label);
      res.json({ success: true });
    },
  };
}
