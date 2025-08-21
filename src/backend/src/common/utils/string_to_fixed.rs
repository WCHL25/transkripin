use crate::common::*;

#[allow(dead_code)] // Not Used Yet
pub fn string_to_fixed(s: &str) -> FixedString {
  let mut fixed = [0u8; 32];
  let bytes = s.as_bytes();
  let len = bytes.len().min(32);
  fixed[..len].copy_from_slice(&bytes[..len]);
  fixed
}
