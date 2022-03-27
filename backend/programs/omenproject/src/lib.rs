use anchor_lang::prelude::*;

declare_id!("Bj6u3CtKV2Hga2yZpAxz2hkpAGwgAmweT2YyJx9z1sGf");

#[program]
pub mod omenproject {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_projects = 0;
        Ok(())
    }

    pub fn add_project(ctx: Context<AddProject>, project_link: String, project_title: String, project_type: String) -> ProgramResult {

        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        let item = ItemStruct {
            project_link: project_link.to_string(),
            project_title: project_title.to_string(),
            project_type: project_type.to_string(),
            user_address: *user.to_account_info().key,
        };

        base_account.project_list.push(item);
        base_account.total_projects += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddProject<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}


#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub project_link: String,
    pub project_title: String,
    pub project_type: String,
    pub user_address: Pubkey,
}

#[account]
pub struct BaseAccount {
    pub total_projects: u64,
    pub project_list: Vec<ItemStruct>,
}
