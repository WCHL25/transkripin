use crate::RNG;
use std::time::Duration;
use rand::{ RngCore, SeedableRng, rngs::StdRng };
use ic_cdk::{ spawn, api::management_canister::main::raw_rand };
use ic_cdk_timers::set_timer;

// Some application-specific error code
pub fn custom_getrandom(buf: &mut [u8]) -> Result<(), getrandom::Error> {
    RNG.with(|rng| {
        if let Some(ref mut rng) = *rng.borrow_mut() {
            rng.fill_bytes(buf);
            Ok(())
        } else {
            Err(getrandom::Error::UNEXPECTED)
        }
    })
}

pub fn init_rng() {
    set_timer(Duration::ZERO, ||
        spawn(async {
            let (seed,) = raw_rand().await.unwrap();

            RNG.with(|rng| {
                *rng.borrow_mut() = Some(StdRng::from_seed(seed.try_into().unwrap()));
            });
        })
    );
}
