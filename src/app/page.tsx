import { redirect } from "next/navigation";

const HomePage = () => {
  redirect("/authentication");
};

export default HomePage;
