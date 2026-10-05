import EditRecord from "../../[resource]/[id]/page";

// /admin/categories/ has its own tree manager page, so the edit form needs an explicit route here.
export default async function CategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditRecord params={Promise.resolve({ resource: "categories", id })} />;
}
