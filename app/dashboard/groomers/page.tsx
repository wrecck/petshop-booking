import { redirect } from "next/navigation";
import { Plus, Scissors, UserRound } from "lucide-react";
import { addGroomer, updateGroomer } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

type Service = {
  id: string;
  name: string;
};

type Groomer = {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  initials: string;
  active: boolean;
  staff_services: { service_id: string }[];
};

export default async function GroomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!shop) redirect("/auth/provision");

  const [{ data: staff }, { data: services }] = await Promise.all([
    supabase
      .from("staff")
      .select("id,user_id,name,role,initials,active,staff_services(service_id)")
      .eq("shop_id", shop.id)
      .order("created_at"),
    supabase
      .from("services")
      .select("id,name")
      .eq("shop_id", shop.id)
      .eq("active", true)
      .order("sort_order"),
  ]);

  const groomers = (staff ?? []) as Groomer[];
  const serviceRows = (services ?? []) as Service[];

  return (
    <div className="dashboard-shell">
      <section className="dashboard-welcome compact">
        <div>
          <p className="eyebrow">Team</p>
          <h1>Groomers</h1>
          <p>Add team members and choose which services they can perform.</p>
        </div>
      </section>

      <section className="groomer-admin-grid">
        {groomers.map((groomer) => {
          const assigned = new Set(
            groomer.staff_services.map((service) => service.service_id),
          );
          return (
            <form
              className="groomer-admin-card"
              action={updateGroomer}
              key={groomer.id}
            >
              <input type="hidden" name="staffId" value={groomer.id} />
              <div className="groomer-admin-heading">
                <span className="avatar peach">{groomer.initials}</span>
                <div>
                  <strong>{groomer.name}</strong>
                  <small>
                    {groomer.user_id === user.id
                      ? "Owner account"
                      : groomer.active
                        ? "Active groomer"
                        : "Hidden from booking"}
                  </small>
                </div>
              </div>
              <label>
                Display name
                <input name="name" required defaultValue={groomer.name} />
              </label>
              <label>
                Role or specialty
                <input name="role" required defaultValue={groomer.role} />
              </label>
              <label>
                Booking status
                <select
                  name="active"
                  defaultValue={groomer.active ? "true" : "false"}
                >
                  <option value="true">Available for booking</option>
                  <option value="false">Hidden from booking</option>
                </select>
              </label>
              <fieldset>
                <legend>Services</legend>
                {serviceRows.map((service) => (
                  <label key={service.id}>
                    <input
                      type="checkbox"
                      name="services"
                      value={service.id}
                      defaultChecked={assigned.has(service.id)}
                    />
                    {service.name}
                  </label>
                ))}
              </fieldset>
              <button className="primary-button">Save groomer</button>
            </form>
          );
        })}

        <form className="groomer-admin-card add" action={addGroomer}>
          <div className="groomer-admin-heading">
            <span className="add-groomer-icon">
              <Plus />
            </span>
            <div>
              <strong>Add a groomer</strong>
              <small>New groomers receive all active services.</small>
            </div>
          </div>
          <label>
            Display name
            <input name="name" required placeholder="Morgan Lee" />
          </label>
          <label>
            Role or specialty
            <input name="role" required placeholder="Senior groomer" />
          </label>
          <div className="groomer-placeholder">
            <UserRound />
            <p>
              The groomer will appear on your public booking page as soon as
              they are added.
            </p>
          </div>
          <button className="primary-button">
            <Scissors size={16} /> Add groomer
          </button>
        </form>
      </section>
    </div>
  );
}
