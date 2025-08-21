#[macro_export]
macro_rules! impl_storable {
  ($struct_name:ty) => {
    use candid::{ Decode, Encode };
    use std::borrow::Cow;
    use ic_stable_structures::Storable;
    use ic_stable_structures::storable::Bound;
    
    use crate::common::constants::DEFAULT_MAX_VALUE_SIZE;

    impl Storable for $struct_name {
        fn to_bytes(&self) -> Cow<[u8]> {
          Encode!(&self).map_or_else(
            |err| {
                panic!("Failed to encode {}: {}", stringify!($struct_name), err);
            },
            |encoded| Cow::Owned(encoded),
        )
        }

        fn from_bytes(bytes: Cow<[u8]>) -> Self {
          Decode!(bytes.as_ref(), Self).map_or_else(
              |err| {
                panic!(
                  "Failed to decode {} from bytes: {}\nBytes: {:?}",
                  stringify!($struct_name),
                  err,
                  bytes);
              },
              |decoded| decoded,
          )
        }

        const BOUND: Bound = Bound::Bounded {
            max_size: DEFAULT_MAX_VALUE_SIZE,
            is_fixed_size: false,
        };
    }
  };
}
