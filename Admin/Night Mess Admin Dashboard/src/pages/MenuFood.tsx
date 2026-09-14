import { useState } from "react";
import { Plus, Edit2, Trash2, Package, Search } from "lucide-react";
import { useStore, FoodItem, Availability } from "../store";
import { Card, Badge, Button, PageHeader, Input, Select, Modal, Textarea, StatCard } from "../components/ui";

const CATEGORIES = ["Breakfast", "Main Course", "Rice", "Bread", "Snacks", "Beverages", "Sides", "Desserts"];

function FoodModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: FoodItem;
  onSave: (food: Omit<FoodItem, "id">) => void;
}) {
  const blank: Omit<FoodItem, "id"> = {
    name: "", category: "Main Course", stock: 0, maxStock: 100,
    availability: "available", price: 0, wastage: 0, unit: "servings",
  };
  const [form, setForm] = useState<Omit<FoodItem, "id">>(initial ? { ...initial } : blank);

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, stock: Number(form.stock), maxStock: Number(form.maxStock), price: Number(form.price), wastage: Number(form.wastage) });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Food Item" : "Add Food Item"} width="max-w-lg">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dal Makhani" className="col-span-2" />
          <Select label="Category" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Unit" value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="servings" />
          <Input label="Price (₹)" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
          <Input label="Max Stock" type="number" value={form.maxStock} onChange={(e) => set("maxStock", e.target.value)} />
          <Input label="Current Stock" type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
          <Input label="Wastage" type="number" value={form.wastage} onChange={(e) => set("wastage", e.target.value)} />
          <Select label="Availability" value={form.availability} onChange={(e) => set("availability", e.target.value as Availability)}>
            <option value="available">Available</option>
            <option value="limited">Limited</option>
            <option value="unavailable">Unavailable</option>
          </Select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="primary" size="sm" onClick={handleSave} className="flex-1">{initial ? "Save Changes" : "Add Item"}</Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function MenuFood() {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterAvail, setFilterAvail] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | undefined>();
  const [stockEdit, setStockEdit] = useState<Record<string, string>>({});

  const allCategories = ["All", ...Array.from(new Set(state.foodItems.map((f) => f.category)))];

  const filtered = state.foodItems.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || f.category === filterCat;
    const matchAvail = filterAvail === "All" || f.availability === filterAvail;
    return matchSearch && matchCat && matchAvail;
  });

  const totalWastage = state.foodItems.reduce((s, f) => s + f.wastage, 0);
  const lowStock = state.foodItems.filter((f) => f.availability !== "available").length;
  const totalItems = state.foodItems.length;

  const openAdd = () => { setEditItem(undefined); setModalOpen(true); };
  const openEdit = (f: FoodItem) => { setEditItem(f); setModalOpen(true); };

  const handleSave = (food: Omit<FoodItem, "id">) => {
    if (editItem) dispatch({ type: "EDIT_FOOD", food: { ...food, id: editItem.id } });
    else dispatch({ type: "ADD_FOOD", food });
  };

  const handleDelete = (foodId: string) => {
    if (confirm("Delete this food item?")) dispatch({ type: "DELETE_FOOD", foodId });
  };

  const handleStockUpdate = (foodId: string) => {
    const val = stockEdit[foodId];
    if (val !== undefined && !isNaN(Number(val))) {
      dispatch({ type: "UPDATE_STOCK", foodId, stock: Number(val) });
      setStockEdit((s) => { const n = { ...s }; delete n[foodId]; return n; });
    }
  };

  const availVariant = (a: Availability) => a === "available" ? "success" : a === "limited" ? "warning" : "danger";

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Menu & Food" subtitle="Manage food items, stock levels and availability">
        <Button variant="primary" size="sm" onClick={openAdd}>
          <span className="flex items-center gap-1.5"><Plus size={12} /> Add Item</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Items" value={totalItems} accent="cyan" icon={<Package size={16} />} />
        <StatCard label="Not Available" value={lowStock} sub="Limited or unavailable" accent={lowStock > 3 ? "red" : "yellow"} icon={<Package size={16} />} />
        <StatCard label="Total Wastage" value={`${totalWastage}`} sub="Plates today" accent="red" icon={<Package size={16} />} />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-40">
            <Input placeholder="Search food items..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-36">
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={filterAvail} onChange={(e) => setFilterAvail(e.target.value)} className="w-36">
            <option value="All">All Status</option>
            <option value="available">Available</option>
            <option value="limited">Limited</option>
            <option value="unavailable">Unavailable</option>
          </Select>
        </div>
      </Card>

      {/* Food grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((food) => {
          const pct = Math.round((food.stock / food.maxStock) * 100);
          const stockInputVal = stockEdit[food.id] !== undefined ? stockEdit[food.id] : String(food.stock);
          return (
            <Card key={food.id} className="hover:border-[#243352] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs font-semibold text-[#dce6f5]">{food.name}</div>
                  <div className="text-[10px] text-[#5a7099] mono mt-0.5">{food.category} · ₹{food.price}/{food.unit}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(food)} className="text-[#3a4d6b] hover:text-[#5a7099] transition-colors p-1">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(food.id)} className="text-[#3a4d6b] hover:text-[#ff3d71] transition-colors p-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Stock bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] mono text-[#5a7099]">Stock</span>
                  <span className="text-[10px] mono text-[#a0b4cc]">{food.stock}/{food.maxStock} {food.unit}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#1a2540]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: food.availability === "unavailable" ? "#ff3d71" : food.availability === "limited" ? "#ffb300" : "#00e676",
                    }}
                  />
                </div>
                <div className="text-[9px] text-[#3a4d6b] mono mt-0.5">Wastage: {food.wastage} {food.unit}</div>
              </div>

              {/* Availability + Stock controls */}
              <div className="flex items-center gap-2 mb-2.5">
                <Badge variant={availVariant(food.availability)} size="xs">{food.availability.toUpperCase()}</Badge>
                <div className="flex gap-1 ml-auto">
                  {(["available", "limited", "unavailable"] as Availability[]).map((a) => (
                    <button
                      key={a}
                      onClick={() => dispatch({ type: "SET_AVAILABILITY", foodId: food.id, availability: a })}
                      className={`text-[9px] px-1.5 py-0.5 rounded mono font-medium transition-colors ${
                        food.availability === a
                          ? a === "available" ? "bg-[#00e67620] text-[#00e676]" : a === "limited" ? "bg-[#ffb30020] text-[#ffb300]" : "bg-[#ff3d7120] text-[#ff3d71]"
                          : "bg-[#1a2540] text-[#3a4d6b] hover:text-[#5a7099]"
                      }`}
                    >
                      {a === "available" ? "AVL" : a === "limited" ? "LTD" : "UNV"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock update */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={stockInputVal}
                  onChange={(e) => setStockEdit((s) => ({ ...s, [food.id]: e.target.value }))}
                  className="flex-1 bg-[#080d1a] border border-[#1a2540] rounded-lg px-2 py-1 text-[10px] mono text-[#dce6f5] focus:outline-none focus:border-[#00c8ff40] w-0"
                  min={0}
                  max={food.maxStock}
                />
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleStockUpdate(food.id)}
                  disabled={stockEdit[food.id] === undefined}
                >
                  Update Stock
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-[#3a4d6b]">No food items match your filter</div>
      )}

      <FoodModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editItem}
        onSave={handleSave}
      />
    </div>
  );
}
