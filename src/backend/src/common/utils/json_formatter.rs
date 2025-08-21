use serde::Serialize;
use serde_json::to_string_pretty;

pub fn to_json_format<T: Serialize>(object: &T) -> String {
  return to_string_pretty(object).unwrap();
}

// pub fn string_to_json(value: String) -> Value {
//   return from_str(&value).unwrap();
// }
