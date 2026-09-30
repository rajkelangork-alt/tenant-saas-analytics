import asyncio

import asyncpg  # type: ignore[import-untyped]


async def create_db() -> None:
    conn = await asyncpg.connect("postgresql://postgres:1234@localhost:5432/postgres")
    try:
        await conn.execute("CREATE DATABASE saas_analytics;")
        print("Database 'saas_analytics' created successfully!")
    except asyncpg.PostgresError as e:
        print(f"Notice: {e}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(create_db())