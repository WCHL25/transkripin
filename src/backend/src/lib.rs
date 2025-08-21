/// Library
use candid::Principal;
use getrandom::register_custom_getrandom;
use ic_cdk::{ init, export_candid, post_upgrade };
use ic_stable_structures::{ DefaultMemoryImpl, StableBTreeMap };
use ic_stable_structures::memory_manager::{ MemoryManager, VirtualMemory };
use rand::rngs::StdRng;
use std::cell::RefCell;

/// Modules
mod common;
mod modules;

// In-Code
use common::*;
use modules::*;

thread_local! {
    // A global random number generator, seeded when the canister is initialized
    static RNG: RefCell<Option<StdRng>> = RefCell::new(None);

    // Memory Manager
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    static USERS: RefCell<
        StableBTreeMap<StorageKey, User, VirtualMemory<DefaultMemoryImpl>>
    > = RefCell::new({
        let memory = MEMORY_MANAGER.with(|m| m.borrow().get(MEMORY_ID_USERS));
        StableBTreeMap::init(memory)
    });

    static PRINCIPALS: RefCell<
        StableBTreeMap<Principal, String, VirtualMemory<DefaultMemoryImpl>>
    > = std::cell::RefCell::new({
        let memory = MEMORY_MANAGER.with(|m| m.borrow().get(MEMORY_ID_PRINCIPALS));
        StableBTreeMap::init(memory)
    });
}

#[init]
fn init() {
    init_rng();
}

#[post_upgrade]
pub fn post_upgrade() {
    init_rng();
}

register_custom_getrandom!(custom_getrandom);

export_candid!();
