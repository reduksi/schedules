const api_url = 'http://localhost:3000/detail';

export const getAll = async () => {
    return await fetch(api_url, {
        method: 'GET'
      });
}

export const create = async (data) => {
    return await fetch(api_url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
}
