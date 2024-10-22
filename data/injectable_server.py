from typing import Optional
import asyncpg
from fastapi import FastAPI, HTTPException, Query
from unique_appender import UniqueLineAppender

app = FastAPI()


class Database:
    _instance: Optional["Database"] = None
    _connection: Optional[asyncpg.Connection] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def get_connection(self) -> asyncpg.Connection:
        if self._connection is None:
            self._connection = await asyncpg.connect(
                user="guepard",
                password="1234",
                database="pagila",
                host="localhost",
            )
        return self._connection

    async def close(self):
        if self._connection:
            await self._connection.close()
            self._connection = None


appender = UniqueLineAppender("./data/query/boolean-based.txt", 0.9)
db = Database()

@app.get("/films")
async def get_films(
    category: str = Query(..., description="Film category to filter by"),
):
    try:
        query = f"""SELECT f.* FROM film f JOIN film_category fc ON fc.film_id = f.film_id JOIN category c ON c.category_id = fc.category_id WHERE c.name ILIKE '%{category}%'"""

        await appender.append_line(query)

        conn = await db.get_connection()
        rows = await conn.fetch(query)

        films = [dict(row) for row in rows]

        return {"films": films}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
