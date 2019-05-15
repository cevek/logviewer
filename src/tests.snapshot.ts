const json = {
    pos: 0,
    message: 'Hello',
    type: 'info',
    date: '2019-05-12T19:08:04.100Z',
    json: {
        name: 'app',
        version: [1],
    },
    children: [
        {
            pos: 6,
            message: 'Not found',
            type: 'warn',
            date: '2019-05-12T19:08:04.200Z',
            json: {
                ip: 1225325,
            },
            children: [
                {
                    pos: 12,
                    message: 'yeh',
                    type: 'error',
                    date: '2019-05-12T19:08:04.300Z',
                    json: {
                        name: 'boom',
                    },
                    children: [],
                },
            ],
        },
    ],
};
export const testSnapshots = {
    findByMsg: {
        root: {roots: [json], select: [0]},
        sub: {roots: [json], select: [6]},
        subSub: {roots: [json], select: [12]},
    },

    findByType: {
        root: {roots: [json], select: [0]},
        sub: {roots: [json], select: [6]},
        subSub: {roots: [json], select: [12]},
    },

    findByValue: {
        root: {roots: [json], select: [0]},
        sub: {roots: [json], select: [6]},
        subSub: {roots: [json], select: [12]},
    },
};
