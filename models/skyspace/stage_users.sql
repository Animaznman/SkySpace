{{ config(materialized='table') }}

select *
from `skyspace-476120.skyspace.users`