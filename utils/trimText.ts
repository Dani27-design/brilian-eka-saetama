export const trimByParentheses = (data:string) => {
  let [data_a, data_b] = data.split(" (");
  data_b = data_b.replace(")", "");

  return {
    a: data_a.trim(),
    b: data_b.trim(),
  };
};
