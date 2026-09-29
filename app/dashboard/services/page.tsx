import { Plus, Scissors } from "lucide-react";
import { addService, updateService } from "@/app/dashboard/actions";
import { getDashboardContext } from "@/lib/dashboard-context";

type Service = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  active: boolean;
};

export default async function ServicesPage() {
  const { supabase, shop } = await getDashboardContext();
  const { data } = await supabase
    .from("services")
    .select("id,name,description,duration_minutes,price_cents,active")
    .eq("shop_id", shop.id)
    .order("sort_order");
  const services = (data ?? []) as Service[];

  return (
    <div className="dashboard-shell">
      <section className="dashboard-welcome compact">
        <div>
          <p className="eyebrow">Offerings</p>
          <h1>Services</h1>
          <p>Edit service details, pricing, duration, and booking visibility.</p>
        </div>
      </section>

      <section className="service-editor-grid">
        {services.map((service) => (
          <form
            className="service-editor-card"
            action={updateService}
            key={service.id}
          >
            <input type="hidden" name="serviceId" value={service.id} />
            <div className="service-editor-heading">
              <span><Scissors /></span>
              <div>
                <strong>{service.name}</strong>
                <small>
                  {service.active
                    ? "Visible on booking page"
                    : "Hidden from booking page"}
                </small>
              </div>
            </div>
            <label>
              Service name
              <input name="name" required defaultValue={service.name} />
            </label>
            <label>
              Description
              <textarea
                name="description"
                rows={3}
                defaultValue={service.description}
              />
            </label>
            <div className="service-editor-row">
              <label>
                Duration (minutes)
                <input
                  name="duration"
                  required
                  type="number"
                  min="15"
                  step="15"
                  defaultValue={service.duration_minutes}
                />
              </label>
              <label>
                Price ({shop.currency})
                <input
                  name="price"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={(service.price_cents / 100).toFixed(2)}
                />
              </label>
            </div>
            <label>
              Booking status
              <select
                name="active"
                defaultValue={service.active ? "true" : "false"}
              >
                <option value="true">Visible and bookable</option>
                <option value="false">Hidden from customers</option>
              </select>
            </label>
            <button className="primary-button">Save changes</button>
          </form>
        ))}

        <form className="service-editor-card add" action={addService}>
          <input type="hidden" name="shopId" value={shop.id} />
          <div className="service-editor-heading">
            <span><Plus /></span>
            <div>
              <strong>Add a service</strong>
              <small>Assigned to all active groomers automatically.</small>
            </div>
          </div>
          <label>
            Service name
            <input name="name" required placeholder="Nail trim" />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={3}
              placeholder="What is included in this service?"
            />
          </label>
          <div className="service-editor-row">
            <label>
              Duration (minutes)
              <input
                name="duration"
                required
                type="number"
                min="15"
                step="15"
                defaultValue="30"
              />
            </label>
            <label>
              Price ({shop.currency})
              <input
                name="price"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue="25"
              />
            </label>
          </div>
          <button className="primary-button">
            <Plus size={16} /> Add service
          </button>
        </form>
      </section>
    </div>
  );
}
