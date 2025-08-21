use crate::common::*;

#[allow(dead_code)] // Not Used Yet
pub fn fixed_to_string(fixed: &FixedString) -> String {
  String::from_utf8(
    fixed
      .iter()
      .take_while(|&&x| x != 0)
      .copied()
      .collect()
  ).unwrap_or_default()
}
